<?php

namespace Tests\Feature;

use App\Models\AppUser;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class GovernanceTest extends TestCase
{
    use RefreshDatabase;

    /** @param list<string> $permissions */
    private function tokenFor(array $permissions, string $email = 'gov@nafusah.com'): string
    {
        AppUser::create([
            'name' => 'مسؤول الحوكمة',
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
        return $this->tokenFor(['strategy.view', 'strategy.manage', 'projects.view', 'projects.manage']);
    }

    /** @return array<string, mixed> */
    private function objectivePayload(array $overrides = []): array
    {
        return array_merge([
            'title' => 'رفع جاهزية البنية التحتية',
            'description' => 'تحديث الشبكة ومركز البيانات',
            'pillar' => 'البنية التحتية',
            'startYear' => 2026,
            'endYear' => 2028,
            'owner' => 'محمد الحملي',
            'status' => 'active',
            'kpis' => [
                ['name' => 'نسبة توفر الأنظمة', 'unit' => '%', 'baseline' => 95, 'current' => 97, 'target' => 99.5],
            ],
        ], $overrides);
    }

    /** @return array<string, mixed> */
    private function projectPayload(array $overrides = []): array
    {
        return array_merge([
            'name' => 'ترقية الجدار الناري',
            'manager' => 'أحمد علي',
            'department' => 'تقنية المعلومات',
            'startDate' => '2026-12-01',
            'endDate' => '2027-03-31',
            'budget' => 45000,
            'priority' => 'high',
            'status' => 'in_progress',
            'progress' => 30,
            'milestones' => [
                ['title' => 'توريد الأجهزة', 'dueDate' => '2027-01-15', 'done' => true],
                ['title' => 'التركيب والتشغيل', 'dueDate' => '2027-03-01', 'done' => false],
            ],
            'risks' => [
                ['description' => 'تأخر التوريد', 'likelihood' => 'medium', 'impact' => 'high', 'mitigation' => 'مورد بديل'],
            ],
        ], $overrides);
    }

    public function test_manager_can_crud_objectives_and_projects(): void
    {
        $token = $this->managerToken();

        $objective = $this->withToken($token)->postJson('/api/strategic-objectives', $this->objectivePayload())
            ->assertCreated()
            ->assertJsonPath('id', 'OBJ-001')
            ->assertJsonPath('startYear', 2026)
            ->assertJsonPath('kpis.0.name', 'نسبة توفر الأنظمة')
            ->json();

        $project = $this->withToken($token)->postJson('/api/it-projects', $this->projectPayload(['objectiveId' => $objective['id']]))
            ->assertCreated()
            ->assertJsonPath('id', 'PRJ-001')
            ->assertJsonPath('objectiveId', 'OBJ-001')
            ->assertJsonPath('milestones.0.dueDate', '2027-01-15')
            ->assertJsonPath('risks.0.impact', 'high')
            ->json();

        $this->withToken($token)->putJson("/api/it-projects/{$project['id']}", array_merge($project, ['progress' => 100, 'status' => 'completed']))
            ->assertOk()
            ->assertJsonPath('progress', 100)
            ->assertJsonPath('status', 'completed');

        $this->withToken($token)->getJson('/api/it-projects')->assertOk()->assertJsonCount(1);
        $this->assertDatabaseHas('audit_logs', ['entity_type' => 'it_project', 'action' => 'updated']);
    }

    public function test_objective_with_linked_projects_cannot_be_deleted(): void
    {
        $token = $this->managerToken();
        $objId = $this->withToken($token)->postJson('/api/strategic-objectives', $this->objectivePayload())->json('id');
        $prjId = $this->withToken($token)->postJson('/api/it-projects', $this->projectPayload(['objectiveId' => $objId]))->json('id');

        $this->withToken($token)->deleteJson("/api/strategic-objectives/{$objId}")->assertStatus(422);

        $this->withToken($token)->deleteJson("/api/it-projects/{$prjId}")->assertOk();
        $this->withToken($token)->deleteJson("/api/strategic-objectives/{$objId}")->assertOk();
    }

    public function test_validation_rejects_bad_values(): void
    {
        $token = $this->managerToken();

        $this->withToken($token)->postJson('/api/strategic-objectives', $this->objectivePayload(['startYear' => 2028, 'endYear' => 2026]))
            ->assertStatus(422)->assertJsonValidationErrors(['end_year']);

        $this->withToken($token)->postJson('/api/it-projects', $this->projectPayload(['progress' => 150, 'objectiveId' => 'OBJ-999']))
            ->assertStatus(422)->assertJsonValidationErrors(['progress', 'objective_id']);
    }

    public function test_view_only_user_cannot_modify(): void
    {
        $token = $this->tokenFor(['strategy.view', 'projects.view'], 'viewer@nafusah.com');

        $this->withToken($token)->getJson('/api/strategic-objectives')->assertOk();
        $this->withToken($token)->getJson('/api/it-projects')->assertOk();
        $this->withToken($token)->postJson('/api/strategic-objectives', $this->objectivePayload())->assertForbidden();
        $this->withToken($token)->postJson('/api/it-projects', $this->projectPayload())->assertForbidden();
    }

    public function test_user_without_governance_permissions_is_forbidden(): void
    {
        $token = $this->tokenFor(['devices.view'], 'devices@nafusah.com');

        $this->withToken($token)->getJson('/api/strategic-objectives')->assertForbidden();
        $this->withToken($token)->getJson('/api/it-projects')->assertForbidden();
    }
}
