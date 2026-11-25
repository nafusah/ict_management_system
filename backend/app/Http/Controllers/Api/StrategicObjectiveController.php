<?php

namespace App\Http\Controllers\Api;

use App\Models\ItProject;
use App\Models\StrategicObjective;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class StrategicObjectiveController extends CrudController
{
    protected function modelClass(): string
    {
        return StrategicObjective::class;
    }

    protected function entityType(): string
    {
        return 'strategic_objective';
    }

    protected function itemLabel(Model $item): string
    {
        return (string) $item->getAttribute('title');
    }

    protected function rules(?string $id = null): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'pillar' => ['nullable', 'string', 'max:120'],
            'start_year' => ['required', 'integer', 'min:2000', 'max:2100'],
            'end_year' => ['required', 'integer', 'min:2000', 'max:2100', 'gte:start_year'],
            'owner' => ['nullable', 'string', 'max:255'],
            'status' => ['required', Rule::in(['active', 'achieved', 'on_hold', 'cancelled'])],
            'kpis' => ['nullable', 'array', 'max:20'],
            'kpis.*.name' => ['required', 'string', 'max:255'],
            'kpis.*.unit' => ['nullable', 'string', 'max:40'],
            'kpis.*.baseline' => ['nullable', 'numeric'],
            'kpis.*.current' => ['nullable', 'numeric'],
            'kpis.*.target' => ['required', 'numeric'],
        ];
    }

    /** لا يُحذف هدف مرتبطة به مشاريع قائمة. */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $linked = ItProject::query()->where('objective_id', $id)->count();
        if ($linked > 0) {
            return response()->json([
                'message' => "لا يمكن حذف الهدف لارتباطه بعدد {$linked} من المشاريع. انقل المشاريع لهدف آخر أولاً.",
            ], 422);
        }

        return parent::destroy($request, $id);
    }
}
