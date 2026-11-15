<?php

namespace App\Http\Controllers\Api;

use App\Models\Service;

class ServiceController extends CrudController
{
    protected function modelClass(): string
    {
        return Service::class;
    }

    protected function rules(?string $id = null): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
        ];
    }
}
