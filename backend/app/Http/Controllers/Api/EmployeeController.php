<?php

namespace App\Http\Controllers\Api;

use App\Models\Employee;

class EmployeeController extends CrudController
{
    protected function modelClass(): string
    {
        return Employee::class;
    }

    protected function rules(?string $id = null): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'department' => ['required', 'string', 'max:255'],
        ];
    }
}
