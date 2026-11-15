<?php

namespace App\Http\Controllers\Api;

use App\Models\Brand;
use Illuminate\Validation\Rule;

class BrandController extends CrudController
{
    protected function modelClass(): string
    {
        return Brand::class;
    }

    protected function rules(?string $id = null): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'category' => ['required', Rule::in(['device', 'ink'])],
        ];
    }
}
