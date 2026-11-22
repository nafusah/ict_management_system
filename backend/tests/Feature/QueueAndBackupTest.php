<?php

namespace Tests\Feature;

use App\Jobs\CheckSystemAlertsJob;
use App\Jobs\CreateDatabaseBackupJob;
use App\Models\AppUser;
use App\Models\Subscription;
use App\Services\DatabaseBackupService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class QueueAndBackupTest extends TestCase
{
    use RefreshDatabase;

    public function test_artisan_commands_dispatch_expected_jobs(): void
    {
        Queue::fake();

        $this->artisan('ict:backup')->assertExitCode(0);
        $this->artisan('ict:check-alerts')->assertExitCode(0);

        Queue::assertPushed(CreateDatabaseBackupJob::class);
        Queue::assertPushed(CheckSystemAlertsJob::class);
    }

    public function test_check_system_alerts_job_updates_subscription_statuses(): void
    {
        $expired = Subscription::create([
            'service_name' => 'Expired Service',
            'provider' => 'Provider A',
            'category' => 'cloud',
            'start_date' => now()->subYear()->toDateString(),
            'end_date' => now()->subDays(2)->toDateString(),
            'alert_days_before' => 30,
            'seats' => 10,
            'annual_cost' => 1000,
            'department' => 'تقنية المعلومات',
            'status' => 'active',
            'cancelled' => false,
        ]);

        $expiring = Subscription::create([
            'service_name' => 'Expiring Service',
            'provider' => 'Provider B',
            'category' => 'cloud',
            'start_date' => now()->subMonths(11)->toDateString(),
            'end_date' => now()->addDays(10)->toDateString(),
            'alert_days_before' => 30,
            'seats' => 5,
            'annual_cost' => 500,
            'department' => 'تقنية المعلومات',
            'status' => 'active',
            'cancelled' => false,
        ]);

        $cancelled = Subscription::create([
            'service_name' => 'Cancelled Service',
            'provider' => 'Provider C',
            'category' => 'cloud',
            'start_date' => now()->subYear()->toDateString(),
            'end_date' => now()->subDays(5)->toDateString(),
            'alert_days_before' => 30,
            'seats' => 5,
            'annual_cost' => 500,
            'department' => 'تقنية المعلومات',
            'status' => 'cancelled',
            'cancelled' => true,
        ]);

        (new CheckSystemAlertsJob)->handle();

        $this->assertSame('expired', $expired->fresh()->status);
        $this->assertSame('expiring', $expiring->fresh()->status);
        $this->assertSame('cancelled', $cancelled->fresh()->status);
    }

    public function test_backup_job_creates_and_rotates_backups_to_seven_files(): void
    {
        $sqlitePath = storage_path('framework/testing-backup.sqlite');
        file_put_contents($sqlitePath, 'sqlite-test');
        config(['database.connections.sqlite.database' => $sqlitePath]);

        $backupDir = storage_path('app/private/backups');
        if (is_dir($backupDir)) {
            foreach (glob($backupDir.'/*') ?: [] as $existing) {
                @unlink($existing);
            }
        } else {
            mkdir($backupDir, 0775, true);
        }

        for ($i = 1; $i <= 8; $i++) {
            $oldFile = $backupDir."/ict-backup-2026-01-0{$i}.sqlite";
            file_put_contents($oldFile, 'old');
            touch($oldFile, time() - (100 - $i));
        }

        (new CreateDatabaseBackupJob)->handle(app(DatabaseBackupService::class));

        $files = glob($backupDir.'/ict-backup-*') ?: [];
        $this->assertCount(7, $files);

        foreach ($files as $file) {
            @unlink($file);
        }
        @unlink($sqlitePath);
    }

    public function test_authorized_user_can_download_backup(): void
    {
        $sqlitePath = storage_path('framework/testing-download.sqlite');
        file_put_contents($sqlitePath, 'sqlite-download-test');
        config(['database.connections.sqlite.database' => $sqlitePath]);

        AppUser::create([
            'name' => 'مدير النظام',
            'email' => 'admin@nafusah.com',
            'password' => Hash::make('secret123'),
            'department' => 'تقنية المعلومات',
            'active' => true,
            'permissions' => ['settings.manage'],
        ]);

        $token = $this->postJson('/api/auth/login', [
            'email' => 'admin@nafusah.com',
            'password' => 'secret123',
        ])->json('token');

        $response = $this->withToken($token)->get('/api/settings/backup');
        $response->assertOk();

        @unlink($sqlitePath);
    }
}
