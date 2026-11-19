<?php

namespace App\Http\Controllers\Api;

use App\Models\AuditLog;
use App\Models\Ink;
use App\Models\InkDispense;
use App\Services\InkDispenseNotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class InkController extends CrudController
{
    protected function modelClass(): string
    {
        return Ink::class;
    }

    protected function rules(?string $id = null): array
    {
        return [
            'brand' => ['required', 'string', 'max:255'],
            'model' => ['required', 'string', 'max:255'],
            'color' => ['required', 'string', 'max:32'],
            'printer_type_id' => ['nullable', 'string', 'max:32', 'exists:printer_types,id'],
            'quantity' => ['required', 'integer', 'min:0'],
            'alert_threshold' => ['required', 'integer', 'min:0'],
        ];
    }

    public function store(Request $request): JsonResponse
    {
        $response = parent::store($request);
        if ($response->getStatusCode() === 201) {
            $data = $response->getData(true);
            $inkId = is_array($data) ? ($data['id'] ?? null) : null;
            $ink = $inkId ? Ink::query()->find($inkId) : null;
            if ($ink && (int) $ink->quantity > 0) {
                $addedQty = (int) $ink->quantity;
                $user = $this->currentUser($request);
                dispatch(function () use ($ink, $addedQty, $user) {
                    app(InkDispenseNotificationService::class)->notifyRestock(
                        ink: $ink,
                        addedQty: $addedQty,
                        beforeQty: 0,
                        afterQty: $addedQty,
                        performedBy: $user,
                        operationLabel: 'إضافة صنف حبر جديد',
                    );
                })->afterResponse();
            }
        }

        return $response;
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $beforeQty = (int) (Ink::query()->whereKey($id)->value('quantity') ?? 0);
        $response = parent::update($request, $id);
        $ink = Ink::query()->find($id);

        if ($ink) {
            $afterQty = (int) $ink->quantity;
            $user = $this->currentUser($request);
            if ($afterQty > $beforeQty) {
                dispatch(function () use ($ink, $afterQty, $beforeQty, $user) {
                    app(InkDispenseNotificationService::class)->notifyRestock(
                        ink: $ink,
                        addedQty: $afterQty - $beforeQty,
                        beforeQty: $beforeQty,
                        afterQty: $afterQty,
                        performedBy: $user,
                        operationLabel: 'توريد / إضافة مخزون حبر',
                    );
                })->afterResponse();
            } elseif ($afterQty < $beforeQty && $afterQty <= (int) $ink->alert_threshold) {
                dispatch(function () use ($ink) {
                    app(InkDispenseNotificationService::class)->notifyLowStock([$ink]);
                })->afterResponse();
            }
        }

        return $response;
    }

    public function dispenses(): JsonResponse
    {
        $items = InkDispense::query()
            ->orderByDesc('date')
            ->orderByDesc('id')
            ->get()
            ->map(fn (InkDispense $d) => $this->toCamel($d->toArray()));

        return response()->json($items);
    }

    public function dispense(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'department' => ['required', 'string', 'max:255'],
            'scope' => ['nullable', 'in:personal,shared'],
            'recipientName' => ['nullable', 'string', 'max:255'],
            'recipientEmail' => ['nullable', 'email', 'max:255'],
            'quantity' => ['required', 'integer', 'min:1'],
            'date' => ['nullable', 'date'],
        ]);

        $scope = $validated['scope'] ?? 'shared';
        $recipientName = $scope === 'personal' ? trim((string) ($validated['recipientName'] ?? '')) : '';
        if ($scope === 'personal' && $recipientName === '') {
            abort(422, 'يرجى تحديد اسم الموظف المستلم.');
        }

        $result = DB::transaction(function () use ($id, $validated, $scope, $recipientName, $request) {
            /** @var Ink $ink */
            $ink = Ink::query()->lockForUpdate()->findOrFail($id);

            if ($validated['quantity'] > $ink->quantity) {
                abort(422, 'الكمية المطلوبة أكبر من المتوفر في المخزون.');
            }

            $beforeQty = $ink->quantity;
            $ink->decrement('quantity', $validated['quantity']);

            $dispense = InkDispense::create([
                'ink_id' => $ink->id,
                'department' => $validated['department'],
                'scope' => $scope,
                'recipient_name' => $scope === 'personal' ? $recipientName : null,
                'quantity' => $validated['quantity'],
                'date' => $validated['date'] ?? now()->toDateString(),
            ]);

            $targetDesc = $scope === 'personal'
                ? "{$validated['department']} (الموظف: {$recipientName})"
                : "{$validated['department']} (جماعي)";

            AuditLog::record(
                $this->currentUser($request),
                'dispensed',
                'ink',
                $ink->id,
                "صرف {$validated['quantity']} من ({$ink->model}) إلى {$targetDesc}",
                ['quantity' => $beforeQty],
                [
                    'quantity' => $beforeQty - $validated['quantity'],
                    'department' => $validated['department'],
                    'scope' => $scope,
                    'recipient_name' => $scope === 'personal' ? $recipientName : null,
                    'dispensed' => $validated['quantity'],
                ],
                $request,
            );

            $freshInk = $ink->fresh();

            return [
                'response' => [
                    'ink' => $this->toCamel($freshInk->toArray()),
                    'dispense' => $this->toCamel($dispense->toArray()),
                ],
                'notifyEntry' => ['ink' => $freshInk, 'quantity' => (int) $validated['quantity']],
                'date' => $dispense->date,
            ];
        });

        app(InkDispenseNotificationService::class)->notify(
            dispensedEntries: [$result['notifyEntry']],
            department: $validated['department'],
            scope: $scope,
            recipientName: $scope === 'personal' ? $recipientName : null,
            date: (string) $result['date'],
            performedBy: $this->currentUser($request),
            operationLabel: 'صرف حبر مباشر',
            recipientEmail: $validated['recipientEmail'] ?? null,
        );

        return response()->json($result['response']);
    }

    public function dispenseBatch(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'department' => ['required', 'string', 'max:255'],
            'scope' => ['nullable', 'in:personal,shared'],
            'recipientName' => ['nullable', 'string', 'max:255'],
            'recipientEmail' => ['nullable', 'email', 'max:255'],
            'date' => ['nullable', 'date'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.inkId' => ['required', 'string'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
        ]);

        $scope = $validated['scope'] ?? 'shared';
        $recipientName = $scope === 'personal' ? trim((string) ($validated['recipientName'] ?? '')) : '';
        if ($scope === 'personal' && $recipientName === '') {
            abort(422, 'يرجى تحديد اسم الموظف المستلم.');
        }

        $date = $validated['date'] ?? now()->toDateString();

        $merged = [];
        foreach ($validated['items'] as $row) {
            $inkId = (string) $row['inkId'];
            $merged[$inkId] = ($merged[$inkId] ?? 0) + (int) $row['quantity'];
        }

        $result = DB::transaction(function () use ($validated, $scope, $recipientName, $merged, $date, $request) {
            $updatedInks = [];
            $createdDispenses = [];
            $summaryParts = [];
            $notifyEntries = [];

            foreach ($merged as $inkId => $qty) {
                /** @var Ink $ink */
                $ink = Ink::query()->lockForUpdate()->findOrFail($inkId);
                if ($qty > $ink->quantity) {
                    abort(422, "الكمية المطلوبة من ({$ink->model}) أكبر من المتوفر في المخزون.");
                }

                $ink->decrement('quantity', $qty);
                $dispense = InkDispense::create([
                    'ink_id' => $ink->id,
                    'department' => $validated['department'],
                    'scope' => $scope,
                    'recipient_name' => $scope === 'personal' ? $recipientName : null,
                    'quantity' => $qty,
                    'date' => $date,
                ]);

                $freshInk = $ink->fresh();
                $updatedInks[] = $this->toCamel($freshInk->toArray());
                $createdDispenses[] = $this->toCamel($dispense->toArray());
                $summaryParts[] = "{$qty} × {$ink->model}";
                $notifyEntries[] = ['ink' => $freshInk, 'quantity' => (int) $qty];
            }

            $targetDesc = $scope === 'personal'
                ? "{$validated['department']} (الموظف: {$recipientName})"
                : "{$validated['department']} (جماعي)";

            AuditLog::record(
                $this->currentUser($request),
                'dispensed',
                'ink',
                null,
                "صرف مجمع إلى {$targetDesc}: ".implode('، ', $summaryParts),
                null,
                [
                    'department' => $validated['department'],
                    'scope' => $scope,
                    'recipient_name' => $scope === 'personal' ? $recipientName : null,
                    'items' => $merged,
                ],
                $request,
            );

            return [
                'response' => [
                    'inks' => $updatedInks,
                    'dispenses' => $createdDispenses,
                ],
                'notifyEntries' => $notifyEntries,
            ];
        });

        app(InkDispenseNotificationService::class)->notify(
            dispensedEntries: $result['notifyEntries'],
            department: $validated['department'],
            scope: $scope,
            recipientName: $scope === 'personal' ? $recipientName : null,
            date: (string) $date,
            performedBy: $this->currentUser($request),
            operationLabel: 'صرف أحبار مجمع',
            recipientEmail: $validated['recipientEmail'] ?? null,
        );

        return response()->json($result['response']);
    }
}
