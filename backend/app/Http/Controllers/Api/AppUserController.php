<?php

namespace App\Http\Controllers\Api;

use App\Models\AppUser;
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
            'department' => ['required', 'string', 'max:255'],
            'active' => ['required', 'boolean'],
            'permissions' => ['required', 'array', 'min:1'],
            'permissions.*' => ['string'],
        ];
    }
}
