<?php

namespace App\Http\Controllers\Api;

use App\Models\Device;
use Illuminate\Validation\Rule;

class DeviceController extends CrudController
{
    protected function modelClass(): string
    {
        return Device::class;
    }

    protected function rules(?string $id = null): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'serial_number' => ['required', 'string', 'max:255', Rule::unique('devices', 'serial_number')->ignore($id)],
            'kind' => ['required', 'string', 'max:32'],
            'brand' => ['required', 'string', 'max:255'],
            'department' => ['required', 'string', 'max:255'],
            'employee' => ['required', 'string', 'max:255'],
            'classification' => ['required', Rule::in(['personal', 'shared'])],
            'location' => ['sometimes', Rule::in(['town', 'field'])],
            'floor' => ['nullable', 'string', 'max:32'],
            'office_number' => ['nullable', 'string', 'max:32'],
        ];
    }
}
