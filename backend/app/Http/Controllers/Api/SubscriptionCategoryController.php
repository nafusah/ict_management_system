<?php

namespace App\Http\Controllers\Api;

use App\Models\SubscriptionCategory;
use Illuminate\Validation\Rule;

class SubscriptionCategoryController extends CrudController
{
    protected function modelClass(): string
    {
        return SubscriptionCategory::class;
    }

    protected function rules(?string $id = null): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'icon' => ['nullable', Rule::in(['monitor', 'cloud', 'security', 'network', 'wifi', 'layers'])],
        ];
    }
}
