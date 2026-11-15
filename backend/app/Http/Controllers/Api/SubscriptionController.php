<?php

namespace App\Http\Controllers\Api;

use App\Models\Subscription;
use Illuminate\Validation\Rule;

class SubscriptionController extends CrudController
{
    protected function modelClass(): string
    {
        return Subscription::class;
    }

    protected function rules(?string $id = null): array
    {
        return [
            'service_name' => ['required', 'string', 'max:255'],
            'provider' => ['required', 'string', 'max:255'],
            'category' => ['required', Rule::in(['software', 'cloud', 'security', 'network', 'other'])],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'seats' => ['required', 'integer', 'min:1'],
            'annual_cost' => ['required', 'numeric', 'min:0'],
            'department' => ['required', 'string', 'max:255'],
            'status' => ['required', Rule::in(['active', 'expiring', 'expired', 'cancelled'])],
            'notes' => ['nullable', 'string'],
        ];
    }
}
