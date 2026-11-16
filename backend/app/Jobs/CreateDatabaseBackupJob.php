<?php

namespace App\Jobs;

use App\Models\AuditLog;
use App\Services\DatabaseBackupService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class CreateDatabaseBackupJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 2;

    public function handle(DatabaseBackupService $backupService): void
    {
        $backupDir = storage_path('app/private/backups');
        $result = $backupService->createBackup($backupDir);

        if (! $result) {
            throw new \RuntimeException('Scheduled database backup failed.');
        }

        // الاحتفاظ بآخر 7 نسخ احتياطية فقط لتوفير المساحة
        $files = glob($backupDir.DIRECTORY_SEPARATOR.'ict-backup-*') ?: [];
        rsort($files);
        foreach (array_slice($files, 7) as $oldFile) {
            @unlink($oldFile);
        }

        AuditLog::record(
            null,
            'created',
            'backup',
            $result['connection'],
            "نسخة احتياطية مجدولة تلقائياً: {$result['filename']}",
        );
    }
}
