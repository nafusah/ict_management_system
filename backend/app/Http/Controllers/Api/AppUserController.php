<?php

namespace App\Http\Controllers\Api;

use App\Models\AppUser;
use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AppUserController extends CrudController
{
    protected function modelClass(): string
    {
        return AppUser::class;
    }

    protected function rules(?string $id = null): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('app_users', 'email')->ignore($id)],
            'password' => [$id ? 'nullable' : 'required', 'string', 'min:4', 'max:255'],
            'department' => ['required', 'string', 'max:255'],
            'active' => ['required', 'boolean'],
            'permissions' => ['required', 'array', 'min:1'],
            'permissions.*' => ['string'],
        ];
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $item = AppUser::findOrFail($id);
        $before = $item->toArray();

        $snakeInput = $this->toSnake($request->all());
        $validated = validator($snakeInput, $this->rules($id))->validate();
        if (empty($validated['password'])) {
            unset($validated['password']);
        }

        $item->update($validated);
        $after = $item->fresh()->toArray();

        AuditLog::record(
            $this->currentUser($request),
            'updated',
            $this->entityType(),
            (string) $item->getKey(),
            'تعديل: '.$this->itemLabel($item),
            $before,
            $after,
            $request,
        );

        return response()->json($this->toCamel($after));
    }
}
