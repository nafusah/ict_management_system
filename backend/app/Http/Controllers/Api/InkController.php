<?php

namespace App\Http\Controllers\Api;

use App\Models\AuditLog;
use App\Models\Ink;
use App\Models\InkDispense;
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
            'quantity' => ['required', 'integer', 'min:1'],
            'date' => ['nullable', 'date'],
        ]);

        $result = DB::transaction(function () use ($id, $validated, $request) {
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
                'quantity' => $validated['quantity'],
                'date' => $validated['date'] ?? now()->toDateString(),
            ]);

            AuditLog::record(
                $this->currentUser($request),
                'dispensed',
                'ink',
                $ink->id,
                "صرف {$validated['quantity']} من ({$ink->model}) إلى {$validated['department']}",
                ['quantity' => $beforeQty],
                ['quantity' => $beforeQty - $validated['quantity'], 'department' => $validated['department'], 'dispensed' => $validated['quantity']],
                $request,
            );

            return [
                'ink' => $this->toCamel($ink->fresh()->toArray()),
                'dispense' => $this->toCamel($dispense->toArray()),
            ];
        });

        return response()->json($result);
    }

    public function dispenseBatch(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'department' => ['required', 'string', 'max:255'],
            'date' => ['nullable', 'date'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.inkId' => ['required', 'string'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
        ]);

        $date = $validated['date'] ?? now()->toDateString();

        $merged = [];
        foreach ($validated['items'] as $row) {
            $inkId = (string) $row['inkId'];
            $merged[$inkId] = ($merged[$inkId] ?? 0) + (int) $row['quantity'];
        }

        $result = DB::transaction(function () use ($validated, $merged, $date, $request) {
            $updatedInks = [];
            $createdDispenses = [];
            $summaryParts = [];

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
                    'quantity' => $qty,
                    'date' => $date,
                ]);

                $updatedInks[] = $this->toCamel($ink->fresh()->toArray());
                $createdDispenses[] = $this->toCamel($dispense->toArray());
                $summaryParts[] = "{$qty} × {$ink->model}";
            }

            AuditLog::record(
                $this->currentUser($request),
                'dispensed',
                'ink',
                null,
                "صرف مجمع إلى {$validated['department']}: ".implode('، ', $summaryParts),
                null,
                ['department' => $validated['department'], 'items' => $merged],
                $request,
            );

            return [
                'inks' => $updatedInks,
                'dispenses' => $createdDispenses,
            ];
        });

        return response()->json($result);
    }
}
