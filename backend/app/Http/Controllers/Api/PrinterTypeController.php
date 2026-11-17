<?php

namespace App\Http\Controllers\Api;

use App\Models\PrinterType;

class PrinterTypeController extends CrudController
{
    protected function modelClass(): string
    {
        return PrinterType::class;
    }

    protected function rules(?string $id = null): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'brand' => ['nullable', 'string', 'max:255'],
            'image' => ['nullable', 'string', 'max:1000000'],
        ];
    }
}
