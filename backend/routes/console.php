<?php

use App\Jobs\CheckSystemAlertsJob;
use App\Jobs\CreateDatabaseBackupJob;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('ict:backup', function () {
    CreateDatabaseBackupJob::dispatch();
    $this->info('تمت إضافة مهمة النسخ الاحتياطي إلى الطابور (Queue).');
})->purpose('Dispatch a background database backup job');

Artisan::command('ict:check-alerts', function () {
    CheckSystemAlertsJob::dispatch();
    $this->info('تمت إضافة مهمة فحص التنبيهات وتحديث الاشتراكات إلى الطابور (Queue).');
})->purpose('Dispatch a background job to sync subscription statuses and send low-stock alerts');

Schedule::job(new CreateDatabaseBackupJob)->dailyAt('02:00');
Schedule::job(new CheckSystemAlertsJob)->dailyAt('08:00');
