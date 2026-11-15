<?php

namespace App\Http\Controllers\Api;

use App\Models\InkColor;

class InkColorController extends CrudController
{
    protected function modelClass(): string
    {
        return InkColor::class;
    }

    protected function rules(?string $id = null): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:16'],
            'primary' => ['required', 'string', 'max:16'],
            'light' => ['required', 'string', 'max:16'],
            'border' => ['required', 'string', 'max:16'],
        ];
    }
}
