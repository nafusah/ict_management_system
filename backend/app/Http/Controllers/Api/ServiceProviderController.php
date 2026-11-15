<?php

namespace App\Http\Controllers\Api;

use App\Models\ServiceProvider;

class ServiceProviderController extends CrudController
{
    protected function modelClass(): string
    {
        return ServiceProvider::class;
    }

    protected function rules(?string $id = null): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:64'],
        ];
    }
}
