<?php

namespace App\Http\Controllers\Api;

use App\Models\AuditLog;
use App\Models\Device;
use App\Models\DeviceCustodyRecord;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class DeviceController extends CrudController
{
    /** اسم "المستلم" عند إرجاع الجهاز لمخزن تقنية المعلومات */
    public const STORAGE_EMPLOYEE = 'مخزن تقنية المعلومات';

    public const STORAGE_DEPARTMENT = 'إدارة الاتصالات وتقنية المعلومات';

    public const CONDITIONS = ['new', 'good', 'fair', 'damaged'];

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

    public function store(Request $request): JsonResponse
    {
        $response = parent::store($request);

        if ($response->getStatusCode() === 201) {
            $device = Device::query()->find($response->getData(true)['id'] ?? null);
            if ($device) {
                $this->createRecord($request, $device, 'assigned', null, null, [
                    'notes' => 'تسليم عند تسجيل الجهاز في النظام.',
                ]);
            }
        }

        return $response;
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $before = Device::query()->find($id);
        $response = parent::update($request, $id);
        $after = Device::query()->find($id);

        // أي تغيير في الموظف أو الإدارة من نموذج التعديل يُقيَّد تلقائياً في سجل العهدة
        if ($before && $after && (
            $before->employee !== $after->employee || $before->department !== $after->department
        )) {
            $this->createRecord($request, $after, 'transferred', $before->employee, $before->department, [
                'notes' => 'تعديل من نموذج بيانات الجهاز.',
            ]);
        }

        return $response;
    }

    public function custody(string $id): JsonResponse
    {
        Device::query()->findOrFail($id);

        $records = DeviceCustodyRecord::query()
            ->where('device_id', $id)
            ->orderByDesc('date')
            ->orderByDesc('created_at')
            ->orderByRaw('LENGTH(id) DESC')
            ->orderByDesc('id')
            ->get()
            ->map(fn (DeviceCustodyRecord $r) => $this->toCamel($r->toArray()));

        return response()->json($records);
    }

    public function transfer(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'toEmployee' => ['required', 'string', 'max:255'],
            'toDepartment' => ['required', 'string', 'max:255'],
            'classification' => ['sometimes', Rule::in(['personal', 'shared'])],
            'date' => ['nullable', 'date', 'before_or_equal:today'],
            'condition' => ['nullable', Rule::in(self::CONDITIONS)],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        return $this->moveCustody($request, $id, 'transferred', [
            'employee' => trim($validated['toEmployee']),
            'department' => trim($validated['toDepartment']),
            'classification' => $validated['classification'] ?? null,
        ], $validated);
    }

    public function returnToStorage(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'date' => ['nullable', 'date', 'before_or_equal:today'],
            'condition' => ['nullable', Rule::in(self::CONDITIONS)],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        return $this->moveCustody($request, $id, 'returned', [
            'employee' => self::STORAGE_EMPLOYEE,
            'department' => self::STORAGE_DEPARTMENT,
            'classification' => 'shared',
        ], $validated);
    }

    /**
     * @param  array{employee: string, department: string, classification: ?string}  $target
     * @param  array<string, mixed>  $validated
     */
    private function moveCustody(Request $request, string $id, string $action, array $target, array $validated): JsonResponse
    {
        $result = DB::transaction(function () use ($request, $id, $action, $target, $validated) {
            /** @var Device $device */
            $device = Device::query()->lockForUpdate()->findOrFail($id);

            if ($device->employee === $target['employee'] && $device->department === $target['department']) {
                abort(422, $action === 'returned'
                    ? 'الجهاز موجود في المخزن بالفعل.'
                    : 'الجهاز في عهدة نفس الموظف والإدارة حالياً.');
            }

            $date = $validated['date'] ?? now()->toDateString();
            $lastDate = DeviceCustodyRecord::query()->where('device_id', $device->id)->max('date');
            if ($lastDate && substr((string) $lastDate, 0, 10) > $date) {
                abort(422, 'التاريخ لا يمكن أن يكون قبل آخر حركة في سجل عهدة الجهاز ('.substr((string) $lastDate, 0, 10).').');
            }

            $before = $device->toArray();
            $fromEmployee = $device->employee;
            $fromDepartment = $device->department;

            $device->update(array_filter([
                'employee' => $target['employee'],
                'department' => $target['department'],
                'classification' => $target['classification'],
            ], fn ($v) => $v !== null));

            $record = $this->createRecord($request, $device, $action, $fromEmployee, $fromDepartment, [
                'date' => $date,
                'condition' => $validated['condition'] ?? null,
                'notes' => $validated['notes'] ?? null,
            ]);

            AuditLog::record(
                $this->currentUser($request),
                'updated',
                'device',
                $device->id,
                ($action === 'returned' ? 'إرجاع جهاز للمخزن' : 'نقل عهدة جهاز')
                    ." «{$device->name}» من ({$fromEmployee} - {$fromDepartment}) إلى ({$device->employee} - {$device->department})",
                $before,
                $device->fresh()->toArray(),
                $request,
            );

            return ['device' => $device->fresh(), 'record' => $record];
        });

        return response()->json([
            'device' => $this->toCamel($result['device']->toArray()),
            'record' => $this->toCamel($result['record']->toArray()),
        ]);
    }

    /** @param array<string, mixed> $extra */
    private function createRecord(
        Request $request,
        Device $device,
        string $action,
        ?string $fromEmployee,
        ?string $fromDepartment,
        array $extra = [],
    ): DeviceCustodyRecord {
        $user = $this->currentUser($request);

        return DeviceCustodyRecord::create([
            'device_id' => $device->id,
            'action' => $action,
            'from_employee' => $fromEmployee,
            'from_department' => $fromDepartment,
            'to_employee' => $device->employee,
            'to_department' => $device->department,
            'date' => $extra['date'] ?? now()->toDateString(),
            'condition' => $extra['condition'] ?? null,
            'notes' => $extra['notes'] ?? null,
            'performed_by_id' => $user?->id,
            'performed_by_name' => $user?->name ?? 'النظام',
        ]);
    }
}
