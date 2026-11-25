<?php

namespace Tests\Feature;

use App\Models\AppUser;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class ReportsTest extends TestCase
{
    use RefreshDatabase;

    /** @param list<string> $permissions */
    private function makeUser(string $email, array $permissions): AppUser
    {
        return AppUser::create([
            'name' => 'مستخدم '.$email,
            'email' => $email,
            'password' => Hash::make('secret123'),
            'department' => 'تقنية المعلومات',
            'active' => true,
            'permissions' => $permissions,
        ]);
    }

    private function tokenOf(AppUser $user): string
    {
        return $this->postJson('/api/auth/login', ['email' => $user->email, 'password' => 'secret123'])->json('token');
    }

    public function test_owner_can_log_report_print_for_each_section(): void
    {
        $token = $this->tokenOf($this->makeUser('owner@nafusah.com', ['settings.manage', 'reports.print']));

        foreach (['devices', 'inks', 'subscriptions', 'governance'] as $section) {
            $this->withToken($token)->postJson('/api/reports/print-log', ['section' => $section, 'filters' => 'الكل', 'rows' => 3])
                ->assertOk()
                ->assertJsonPath('ok', true);
        }

        $this->assertSame(4, \App\Models\AuditLog::query()->where('action', 'printed')->count());
        $this->assertDatabaseHas('audit_logs', ['action' => 'printed', 'entity_type' => 'report', 'entity_id' => 'governance']);
    }

    public function test_full_admin_without_permission_cannot_print(): void
    {
        $token = $this->tokenOf($this->makeUser('admin@nafusah.com', ['settings.manage', 'devices.view', 'inks.view', 'subscriptions.view', 'strategy.view', 'projects.view']));

        $this->withToken($token)->postJson('/api/reports/print-log', ['section' => 'devices'])->assertForbidden();
    }

    public function test_invalid_section_is_rejected(): void
    {
        $token = $this->tokenOf($this->makeUser('owner@nafusah.com', ['reports.print']));

        $this->withToken($token)->postJson('/api/reports/print-log', ['section' => 'payroll'])->assertStatus(422);
    }

    public function test_admin_cannot_grant_exclusive_permission(): void
    {
        $token = $this->tokenOf($this->makeUser('admin@nafusah.com', ['settings.manage']));
        $target = $this->makeUser('tech@nafusah.com', ['devices.view']);

        // إنشاء مستخدم جديد بالصلاحية
        $this->withToken($token)->postJson('/api/users', [
            'name' => 'جديد', 'email' => 'new@nafusah.com', 'password' => 'secret', 'department' => 'IT',
            'active' => true, 'permissions' => ['devices.view', 'reports.print'],
        ])->assertForbidden();

        // إضافتها لمستخدم موجود
        $this->withToken($token)->putJson("/api/users/{$target->id}", [
            'name' => $target->name, 'email' => $target->email, 'department' => 'IT',
            'active' => true, 'permissions' => ['devices.view', 'reports.print'],
        ])->assertForbidden();

        $this->assertNotContains('reports.print', $target->fresh()->permissions);
    }

    public function test_admin_cannot_revoke_but_can_edit_owner_other_fields(): void
    {
        $owner = $this->makeUser('owner@nafusah.com', ['settings.manage', 'reports.print']);
        $token = $this->tokenOf($this->makeUser('admin@nafusah.com', ['settings.manage']));

        $this->withToken($token)->putJson("/api/users/{$owner->id}", [
            'name' => $owner->name, 'email' => $owner->email, 'department' => 'IT',
            'active' => true, 'permissions' => ['settings.manage'],
        ])->assertForbidden();

        // تعديل بقية البيانات مع إبقاء الصلاحية كما هي مسموح
        $this->withToken($token)->putJson("/api/users/{$owner->id}", [
            'name' => 'اسم معدّل', 'email' => $owner->email, 'department' => 'IT',
            'active' => true, 'permissions' => ['settings.manage', 'reports.print'],
        ])->assertOk();

        $this->assertContains('reports.print', $owner->fresh()->permissions);
    }

    public function test_owner_can_grant_and_revoke(): void
    {
        $token = $this->tokenOf($this->makeUser('owner@nafusah.com', ['settings.manage', 'reports.print']));
        $target = $this->makeUser('tech@nafusah.com', ['devices.view']);

        $payload = ['name' => $target->name, 'email' => $target->email, 'department' => 'IT', 'active' => true];

        $this->withToken($token)->putJson("/api/users/{$target->id}", $payload + ['permissions' => ['devices.view', 'reports.print']])->assertOk();
        $this->assertContains('reports.print', $target->fresh()->permissions);

        $this->withToken($token)->putJson("/api/users/{$target->id}", $payload + ['permissions' => ['devices.view']])->assertOk();
        $this->assertNotContains('reports.print', $target->fresh()->permissions);
    }
}
