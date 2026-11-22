<?php

namespace App\Http\Controllers\Api;

use App\Models\Subscription;
use App\Services\SubscriptionNotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
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

    public function store(Request $request): JsonResponse
    {
        $response = parent::store($request);
        if ($response->getStatusCode() === 201) {
            $data = $response->getData(true);
            $subId = is_array($data) ? ($data['id'] ?? null) : null;
            $sub = $subId ? Subscription::query()->find($subId) : null;
            if ($sub) {
                app(SubscriptionNotificationService::class)->notifyChange(
                    $sub,
                    'إضافة اشتراك جديد',
                    $this->currentUser($request),
                );
            }
        }

        return $response;
    }

    public function update(Request $request, string $id): JsonResponse
    {
        /** @var Subscription|null $before */
        $before = Subscription::query()->find($id);
        $beforeEnd = $before?->end_date?->toDateString();
        $beforeCancelled = (bool) ($before?->cancelled ?? false);
        $beforeStatus = $before?->status;

        $response = parent::update($request, $id);
        /** @var Subscription|null $after */
        $after = Subscription::query()->find($id);

        if ($after) {
            $endChanged = $after->end_date?->toDateString() !== $beforeEnd;
            $cancelChanged = (bool) $after->cancelled !== $beforeCancelled;
            $statusChanged = $after->status !== $beforeStatus;

            if ($endChanged || $cancelChanged || $statusChanged) {
                app(SubscriptionNotificationService::class)->notifyChange(
                    $after,
                    $endChanged ? 'تحديث / تجديد اشتراك' : 'تحديث حالة اشتراك',
                    $this->currentUser($request),
                );
            }
        }

        return $response;
    }
}
