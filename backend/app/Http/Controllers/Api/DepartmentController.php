<?php

namespace App\Http\Controllers\Api;

use App\Models\AuditLog;
use App\Models\Department;
use App\Models\Employee;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class DepartmentController extends CrudController
{
    protected function modelClass(): string
    {
        return Department::class;
    }

    protected function rules(?string $id = null): array
    {
        return [
            'name' => ['required', 'string', 'max:255', Rule::unique('departments', 'name')->ignore($id)],
        ];
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $item = Department::findOrFail($id);
        $before = $item->toArray();

        $snakeInput = $this->toSnake($request->all());
        $validated = validator($snakeInput, $this->rules($id))->validate();

        DB::transaction(function () use ($item, $validated, $before) {
            $item->update($validated);
            if ($before['name'] !== $validated['name']) {
                Employee::query()
                    ->where('department', $before['name'])
                    ->update(['department' => $validated['name']]);
            }
        });

        $after = $item->fresh()->toArray();
        AuditLog::record(
            $this->currentUser($request),
            'updated',
            'department',
            (string) $item->getKey(),
            "تعديل اسم الإدارة من «{$before['name']}» إلى «{$after['name']}»",
            $before,
            $after,
            $request,
        );

        return response()->json($this->toCamel($after));
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $item = Department::findOrFail($id);
        $count = Employee::query()->where('department', $item->name)->count();
        if ($count > 0) {
            return response()->json([
                'message' => "لا يمكن حذف \"{$item->name}\" لوجود {$count} موظف مرتبط بها.",
            ], 422);
        }

        return parent::destroy($request, $id);
    }
}
