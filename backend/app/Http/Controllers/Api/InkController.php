<?php

namespace App\Http\Controllers\Api;

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

        $result = DB::transaction(function () use ($id, $validated) {
            /** @var Ink $ink */
            $ink = Ink::query()->lockForUpdate()->findOrFail($id);

            if ($validated['quantity'] > $ink->quantity) {
                abort(422, 'الكمية المطلوبة أكبر من المتوفر في المخزون.');
            }

            $ink->decrement('quantity', $validated['quantity']);

            $dispense = InkDispense::create([
                'ink_id' => $ink->id,
                'department' => $validated['department'],
                'quantity' => $validated['quantity'],
                'date' => $validated['date'] ?? now()->toDateString(),
            ]);

            return [
                'ink' => $this->toCamel($ink->fresh()->toArray()),
                'dispense' => $this->toCamel($dispense->toArray()),
            ];
        });

        return response()->json($result);
    }
}
