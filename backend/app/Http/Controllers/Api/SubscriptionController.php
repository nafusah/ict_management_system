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
            'category' => ['required', 'string', 'max:64'],
            'po_number' => ['nullable', 'string', 'max:255'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['required', 'date', Rule::when(fn ($input) => ! empty($input->start_date), ['after_or_equal:start_date'])],
            'alert_days_before' => ['sometimes', 'integer', 'min:0'],
            'seats' => ['sometimes', 'integer', 'min:1'],
            'annual_cost' => ['sometimes', 'numeric', 'min:0'],
            'department' => ['nullable', 'string', 'max:255'],
            'service_location' => ['nullable', 'string', 'max:255'],
            'status' => ['sometimes', Rule::in(['active', 'expiring', 'expired', 'cancelled'])],
            'cancelled' => ['sometimes', 'boolean'],
            'notes' => ['nullable', 'string'],
        ];
    }
}
