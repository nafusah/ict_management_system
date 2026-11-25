<?php

namespace App\Http\Controllers\Api;

use App\Models\ItProject;
use Illuminate\Validation\Rule;

class ItProjectController extends CrudController
{
    protected function modelClass(): string
    {
        return ItProject::class;
    }

    protected function entityType(): string
    {
        return 'it_project';
    }

    protected function rules(?string $id = null): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'objective_id' => ['nullable', 'string', Rule::exists('strategic_objectives', 'id')->whereNull('deleted_at')],
            'manager' => ['nullable', 'string', 'max:255'],
            'department' => ['nullable', 'string', 'max:255'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'budget' => ['nullable', 'numeric', 'min:0'],
            'priority' => ['required', Rule::in(['low', 'medium', 'high', 'critical'])],
            'status' => ['required', Rule::in(['planned', 'in_progress', 'on_hold', 'completed', 'cancelled'])],
            'progress' => ['required', 'integer', 'min:0', 'max:100'],
            'milestones' => ['nullable', 'array', 'max:50'],
            'milestones.*.title' => ['required', 'string', 'max:255'],
            'milestones.*.dueDate' => ['nullable', 'date'],
            'milestones.*.done' => ['boolean'],
            'risks' => ['nullable', 'array', 'max:50'],
            'risks.*.description' => ['required', 'string', 'max:1000'],
            'risks.*.likelihood' => ['required', Rule::in(['low', 'medium', 'high'])],
            'risks.*.impact' => ['required', Rule::in(['low', 'medium', 'high'])],
            'risks.*.mitigation' => ['nullable', 'string', 'max:1000'],
            'notes' => ['nullable', 'string', 'max:5000'],
        ];
    }
}
