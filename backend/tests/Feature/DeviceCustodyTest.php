<?php

namespace Tests\Feature;

use App\Http\Controllers\Api\DeviceController;
use App\Models\AppUser;
use App\Models\Device;
use App\Models\DeviceCustodyRecord;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class DeviceCustodyTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Carbon::setTestNow('2026-11-23 10:00:00');
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    /** @param list<string> $permissions */
    private function tokenFor(array $permissions, string $email = 'it@nafusah.com'): string
    {
        AppUser::create([
            'name' => 'فني الأجهزة',
            'email' => $email,
            'password' => Hash::make('secret123'),
            'department' => 'تقنية المعلومات',
            'active' => true,
            'permissions' => $permissions,
        ]);

        return $this->postJson('/api/auth/login', ['email' => $email, 'password' => 'secret123'])->json('token');
    }

    private function managerToken(): string
    {
        return $this->tokenFor(['devices.view', 'devices.manage']);
    }

    /** @return array<string, mixed> */
    private function devicePayload(array $overrides = []): array
    {
        return array_merge([
            'name' => 'Dell Latitude 5440',
            'serialNumber' => 'SN-12345',
            'kind' => 'pcCase',
            'brand' => 'Dell',
            'department' => 'إدارة المالية',
            'employee' => 'أحمد علي',
            'classification' => 'personal',
        ], $overrides);
    }

    private function createDevice(string $token): string
    {
        return $this->withToken($token)->postJson('/api/devices', $this->devicePayload())->assertCreated()->json('id');
    }

    public function test_creating_device_opens_custody_record(): void
    {
        $token = $this->managerToken();
        $id = $this->createDevice($token);

        $this->withToken($token)->getJson("/api/devices/{$id}/custody")
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.action', 'assigned')
            ->assertJsonPath('0.toEmployee', 'أحمد علي')
            ->assertJsonPath('0.toDepartment', 'إدارة المالية')
            ->assertJsonPath('0.performedByName', 'فني الأجهزة');
    }

    public function test_transfer_moves_device_and_records_history(): void
    {
        $token = $this->managerToken();
        $id = $this->createDevice($token);

        $this->withToken($token)->postJson("/api/devices/{$id}/transfer", [
            'toEmployee' => 'سالم محمد',
            'toDepartment' => 'إدارة الحفر',
            'date' => '2026-11-23',
            'condition' => 'good',
            'notes' => 'انتقال الموظف لإدارة أخرى',
        ])->assertOk()
            ->assertJsonPath('device.employee', 'سالم محمد')
            ->assertJsonPath('device.department', 'إدارة الحفر')
            ->assertJsonPath('record.action', 'transferred')
            ->assertJsonPath('record.fromEmployee', 'أحمد علي')
            ->assertJsonPath('record.toEmployee', 'سالم محمد')
            ->assertJsonPath('record.date', '2026-11-23')
            ->assertJsonPath('record.condition', 'good');

        $this->withToken($token)->getJson("/api/devices/{$id}/custody")
            ->assertOk()
            ->assertJsonCount(2)
            ->assertJsonPath('0.action', 'transferred'); // الأحدث أولاً
    }

    public function test_transfer_to_same_holder_is_rejected(): void
    {
        $token = $this->managerToken();
        $id = $this->createDevice($token);

        $this->withToken($token)->postJson("/api/devices/{$id}/transfer", [
            'toEmployee' => 'أحمد علي',
            'toDepartment' => 'إدارة المالية',
        ])->assertStatus(422);

        $this->assertSame(1, DeviceCustodyRecord::where('device_id', $id)->count());
    }

    public function test_transfer_date_cannot_be_in_future(): void
    {
        $token = $this->managerToken();
        $id = $this->createDevice($token);

        $this->withToken($token)->postJson("/api/devices/{$id}/transfer", [
            'toEmployee' => 'سالم محمد',
            'toDepartment' => 'إدارة الحفر',
            'date' => '2026-12-01',
        ])->assertStatus(422)->assertJsonValidationErrors(['date']);

        $this->assertSame('أحمد علي', Device::find($id)->employee);
    }

    public function test_transfer_date_cannot_precede_last_custody_movement(): void
    {
        $token = $this->managerToken();
        $id = $this->createDevice($token); // قيد التسليم بتاريخ اليوم 2026-11-23

        $this->withToken($token)->postJson("/api/devices/{$id}/transfer", [
            'toEmployee' => 'سالم محمد',
            'toDepartment' => 'إدارة الحفر',
            'date' => '2026-11-20',
        ])->assertStatus(422);

        $this->assertSame('أحمد علي', Device::find($id)->employee);
    }

    public function test_return_puts_device_in_storage_once(): void
    {
        $token = $this->managerToken();
        $id = $this->createDevice($token);

        $this->withToken($token)->postJson("/api/devices/{$id}/return", ['condition' => 'damaged', 'notes' => 'شاشة مكسورة'])
            ->assertOk()
            ->assertJsonPath('device.employee', DeviceController::STORAGE_EMPLOYEE)
            ->assertJsonPath('device.department', DeviceController::STORAGE_DEPARTMENT)
            ->assertJsonPath('record.action', 'returned')
            ->assertJsonPath('record.condition', 'damaged')
            ->assertJsonPath('record.date', '2026-11-23');

        $this->withToken($token)->postJson("/api/devices/{$id}/return")->assertStatus(422);
    }

    public function test_editing_employee_from_form_is_logged_automatically(): void
    {
        $token = $this->managerToken();
        $id = $this->createDevice($token);

        // تعديل بدون تغيير العهدة — لا يُضاف قيد
        $this->withToken($token)->putJson("/api/devices/{$id}", $this->devicePayload(['name' => 'Dell Latitude 5450']))->assertOk();
        $this->assertSame(1, DeviceCustodyRecord::where('device_id', $id)->count());

        // تغيير الموظف — يُضاف قيد نقل
        $this->withToken($token)->putJson("/api/devices/{$id}", $this->devicePayload(['employee' => 'خالد سعيد']))->assertOk();

        $latest = DeviceCustodyRecord::where('device_id', $id)->where('action', 'transferred')->firstOrFail();
        $this->assertSame('أحمد علي', $latest->from_employee);
        $this->assertSame('خالد سعيد', $latest->to_employee);
    }

    public function test_view_only_user_can_read_history_but_not_transfer(): void
    {
        $id = $this->createDevice($this->managerToken());
        $viewer = $this->tokenFor(['devices.view'], 'viewer@nafusah.com');

        $this->withToken($viewer)->getJson("/api/devices/{$id}/custody")->assertOk()->assertJsonCount(1);
        $this->withToken($viewer)->postJson("/api/devices/{$id}/transfer", [
            'toEmployee' => 'سالم محمد',
            'toDepartment' => 'إدارة الحفر',
        ])->assertForbidden();
        $this->withToken($viewer)->postJson("/api/devices/{$id}/return")->assertForbidden();
    }

    public function test_unknown_device_returns_404(): void
    {
        $token = $this->managerToken();

        $this->withToken($token)->getJson('/api/devices/DEV-999/custody')->assertNotFound();
        $this->withToken($token)->postJson('/api/devices/DEV-999/return')->assertNotFound();
    }
}
