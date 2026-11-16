<?php

namespace Tests\Feature;

use App\Models\AppUser;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthAndPermissionsTest extends TestCase
{
    use RefreshDatabase;

    public function test_health_endpoint_returns_ok(): void
    {
        $this->getJson('/api/health')
            ->assertOk()
            ->assertJson(['status' => 'ok']);
    }

    public function test_user_can_login_fetch_me_and_logout(): void
    {
        AppUser::create([
            'name' => 'أحمد علي',
            'email' => 'ahmed@nafusah.com',
            'password' => Hash::make('secret123'),
            'department' => 'تقنية المعلومات',
            'active' => true,
            'permissions' => ['inks.view'],
        ]);

        $login = $this->postJson('/api/auth/login', [
            'email' => 'ahmed@nafusah.com',
            'password' => 'secret123',
        ]);

        $login->assertOk()
            ->assertJsonStructure(['token', 'user' => ['id', 'name', 'email', 'permissions']]);

        $token = $login->json('token');

        $this->withToken($token)
            ->getJson('/api/auth/me')
            ->assertOk()
            ->assertJsonPath('email', 'ahmed@nafusah.com');

        $this->withToken($token)
            ->postJson('/api/auth/logout')
            ->assertOk();

        $this->withToken($token)
            ->getJson('/api/auth/me')
            ->assertUnauthorized();
    }

    public function test_inactive_user_cannot_login(): void
    {
        AppUser::create([
            'name' => 'مستخدم معطل',
            'email' => 'disabled@nafusah.com',
            'password' => Hash::make('secret123'),
            'department' => 'المالية',
            'active' => false,
            'permissions' => [],
        ]);

        $this->postJson('/api/auth/login', [
            'email' => 'disabled@nafusah.com',
            'password' => 'secret123',
        ])->assertForbidden();
    }

    public function test_permission_middleware_blocks_unauthorized_actions(): void
    {
        AppUser::create([
            'name' => 'مشاهد فقط',
            'email' => 'viewer@nafusah.com',
            'password' => Hash::make('secret123'),
            'department' => 'الموارد البشرية',
            'active' => true,
            'permissions' => ['inks.view'],
        ]);

        $token = $this->postJson('/api/auth/login', [
            'email' => 'viewer@nafusah.com',
            'password' => 'secret123',
        ])->json('token');

        $this->withToken($token)
            ->getJson('/api/inks')
            ->assertOk();

        $this->withToken($token)
            ->postJson('/api/inks/dispense-batch', [
                'department' => 'المالية',
                'items' => [['inkId' => 'INK-001', 'quantity' => 1]],
            ])
            ->assertForbidden();

        $this->withToken($token)
            ->getJson('/api/settings/backup')
            ->assertForbidden();
    }
}
