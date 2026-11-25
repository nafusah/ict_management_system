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

    /** صلاحيات حصرية: لا يمنحها ولا يسحبها إلا من يملكها. */
    public const EXCLUSIVE_PERMISSIONS = ['reports.print'];

    /**
     * @param array<int, string> $before
     * @param array<int, string> $after
     */
    private function guardExclusivePermissions(Request $request, array $before, array $after): ?JsonResponse
    {
        $actor = $this->currentUser($request);
        foreach (self::EXCLUSIVE_PERMISSIONS as $perm) {
            $changed = in_array($perm, $before, true) !== in_array($perm, $after, true);
            if ($changed && ! $actor?->hasPermission($perm)) {
                return response()->json([
                    'message' => 'صلاحية "طباعة التقارير" حصرية، ولا يمنحها أو يسحبها إلا من يملكها.',
                ], 403);
            }
        }

        return null;
    }

    public function store(Request $request): JsonResponse
    {
        $requested = (array) $request->input('permissions', []);
        if ($denied = $this->guardExclusivePermissions($request, [], array_map('strval', $requested))) {
            return $denied;
        }

        return parent::store($request);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $item = AppUser::findOrFail($id);
        $before = $item->toArray();

        if ($request->has('permissions')) {
            $denied = $this->guardExclusivePermissions(
                $request,
                is_array($item->permissions) ? $item->permissions : [],
                array_map('strval', (array) $request->input('permissions', [])),
            );
            if ($denied) {
                return $denied;
            }
        }

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
