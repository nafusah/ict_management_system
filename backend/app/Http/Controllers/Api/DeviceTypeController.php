<?php

namespace App\Http\Controllers\Api;

use App\Models\DeviceType;
use Illuminate\Validation\Rule;

class DeviceTypeController extends CrudController
{
    protected function modelClass(): string
    {
        return DeviceType::class;
    }

    protected function rules(?string $id = null): array
    {
        return [
            'label' => ['required', 'string', 'max:255'],
            'icon' => ['required', Rule::in(['monitor', 'pcCase', 'phone', 'printer', 'other'])],
        ];
    }
}
