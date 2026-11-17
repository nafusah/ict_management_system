<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AppUser;
use App\Models\AuditLog;
use App\Models\Ink;
use App\Models\InkDispense;
use App\Models\InkVoucher;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class InkVoucherController extends Controller
{
    protected function currentUser(Request $request): ?AppUser
    {
        /** @var AppUser|null */
        return $request->attributes->get('app_user');
    }

    /** @param array<string, mixed> $data */
    protected function toCamel(array $data): array
    {
        $out = [];
        foreach ($data as $key => $value) {
            if ($key === 'updated_at') {
                continue;
            }
            $out[Str::camel($key)] = $value;
        }
        return $out;
    }

    public function index(): JsonResponse
    {
        $vouchers = InkVoucher::query()
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->get()
            ->map(fn (InkVoucher $v) => $this->toCamel($v->toArray()));

        return response()->json($vouchers);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'department' => ['required', 'string', 'max:255'],
            'scope' => ['nullable', 'in:personal,shared'],
            'recipientName' => ['nullable', 'string', 'max:255'],
            'date' => ['nullable', 'date'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.inkId' => ['required', 'string'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
        ]);

        $scope = $validated['scope'] ?? 'shared';
        $recipientName = $scope === 'personal' ? trim((string) ($validated['recipientName'] ?? '')) : '';
        if ($scope === 'personal' && $recipientName === '') {
            abort(422, 'يرجى تحديد اسم الموظف المستلم.');
        }

        $merged = [];
        foreach ($validated['items'] as $row) {
            $inkId = (string) $row['inkId'];
            $merged[$inkId] = ($merged[$inkId] ?? 0) + (int) $row['quantity'];
        }

        $itemsPayload = [];
        $summaryParts = [];
        foreach ($merged as $inkId => $qty) {
            /** @var Ink $ink */
            $ink = Ink::query()->findOrFail($inkId);
            if ($qty > $ink->quantity) {
                abort(422, "الكمية المطلوبة من ({$ink->model}) أكبر من المتوفر في المخزون ({$ink->quantity}).");
            }
            $itemsPayload[] = [
                'inkId' => $ink->id,
                'model' => $ink->model,
                'brand' => $ink->brand,
                'color' => $ink->color,
                'quantity' => $qty,
            ];
            $summaryParts[] = "{$qty} × {$ink->model}";
        }

        $user = $this->currentUser($request);
        $voucher = InkVoucher::create([
            'department' => $validated['department'],
            'scope' => $scope,
            'recipient_name' => $scope === 'personal' ? $recipientName : null,
            'requester_id' => $user?->id,
            'requester_name' => $user?->name ?? 'مستخدم النظام',
            'status' => 'pending',
            'items' => $itemsPayload,
            'notes' => $validated['notes'] ?? null,
            'date' => $validated['date'] ?? now()->toDateString(),
        ]);

        $targetDesc = $scope === 'personal'
            ? "{$voucher->department} (الموظف: {$recipientName})"
            : "{$voucher->department} (جماعي)";

        AuditLog::record(
            $user,
            'created',
            'ink_voucher',
            $voucher->id,
            "إصدار إذن صرف ({$voucher->id}) إلى {$targetDesc}: ".implode('، ', $summaryParts),
            null,
            $voucher->toArray(),
            $request,
        );

        return response()->json($this->toCamel($voucher->toArray()), 201);
    }

    public function dispense(Request $request, string $id): JsonResponse
    {
        $user = $this->currentUser($request);

        $result = DB::transaction(function () use ($id, $user, $request) {
            /** @var InkVoucher $voucher */
            $voucher = InkVoucher::query()->lockForUpdate()->findOrFail($id);

            if ($voucher->status !== 'pending') {
                abort(422, 'لا يمكن صرف هذا الإذن لأنه تمت معالجته مسبقاً.');
            }

            $date = now()->toDateString();
            $updatedInks = [];
            $summaryParts = [];

            foreach ($voucher->items ?? [] as $row) {
                $inkId = (string) ($row['inkId'] ?? '');
                $qty = (int) ($row['quantity'] ?? 0);
                if (! $inkId || $qty <= 0) {
                    continue;
                }

                /** @var Ink $ink */
                $ink = Ink::query()->lockForUpdate()->findOrFail($inkId);
                if ($qty > $ink->quantity) {
                    abort(422, "الكمية المطلوبة من ({$ink->model}) أكبر من المتوفر حالياً ({$ink->quantity}).");
                }

                $ink->decrement('quantity', $qty);
                InkDispense::create([
                    'ink_id' => $ink->id,
                    'department' => $voucher->department,
                    'scope' => $voucher->scope ?? 'shared',
                    'recipient_name' => $voucher->recipient_name,
                    'quantity' => $qty,
                    'date' => $date,
                ]);

                $updatedInks[] = $this->toCamel($ink->fresh()->toArray());
                $summaryParts[] = "{$qty} × {$ink->model}";
            }

            $before = $voucher->toArray();
            $voucher->update([
                'status' => 'dispensed',
                'approved_by_id' => $user?->id,
                'approved_by_name' => $user?->name ?? 'معتمد الصرف',
                'dispensed_at' => now(),
            ]);

            $after = $voucher->fresh()->toArray();
            $targetDesc = ($voucher->scope ?? 'shared') === 'personal' && $voucher->recipient_name
                ? "{$voucher->department} (الموظف: {$voucher->recipient_name})"
                : "{$voucher->department} (جماعي)";

            AuditLog::record(
                $user,
                'dispensed',
                'ink_voucher',
                $voucher->id,
                "اعتماد وصرف الإذن ({$voucher->id}) إلى {$targetDesc}: ".implode('، ', $summaryParts),
                $before,
                $after,
                $request,
            );

            return [
                'voucher' => $this->toCamel($after),
                'inks' => $updatedInks,
            ];
        });

        return response()->json($result);
    }

    public function reject(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $user = $this->currentUser($request);
        /** @var InkVoucher $voucher */
        $voucher = InkVoucher::query()->findOrFail($id);

        if ($voucher->status !== 'pending') {
            abort(422, 'لا يمكن رفض هذا الإذن لأنه تمت معالجته مسبقاً.');
        }

        $before = $voucher->toArray();
        $voucher->update([
            'status' => 'rejected',
            'approved_by_id' => $user?->id,
            'approved_by_name' => $user?->name ?? 'معتمد الصرف',
            'notes' => ! empty($validated['notes']) ? $validated['notes'] : $voucher->notes,
        ]);

        $after = $voucher->fresh()->toArray();
        AuditLog::record(
            $user,
            'updated',
            'ink_voucher',
            $voucher->id,
            "رفض إذن الصرف ({$voucher->id}) لإدارة {$voucher->department}",
            $before,
            $after,
            $request,
        );

        return response()->json(['voucher' => $this->toCamel($after)]);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        /** @var InkVoucher $voucher */
        $voucher = InkVoucher::query()->findOrFail($id);

        if ($voucher->status === 'dispensed') {
            abort(422, 'لا يمكن حذف إذن تم صرفه بالفعل.');
        }

        $user = $this->currentUser($request);
        if (
            $user
            && ! $user->hasAnyPermission(['inks.vouchers.approve'])
            && $voucher->requester_id !== $user->id
        ) {
            abort(403, 'يمكنك حذف أذونات الصرف التي أنشأتها فقط.');
        }

        $before = $voucher->toArray();
        $voucher->delete();

        AuditLog::record(
            $user,
            'deleted',
            'ink_voucher',
            $id,
            "حذف إذن الصرف ({$id})",
            $before,
            null,
            $request,
        );

        return response()->json(['deleted' => true]);
    }
}
