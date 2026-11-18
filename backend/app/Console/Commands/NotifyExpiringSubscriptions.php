<?php

namespace App\Console\Commands;

use App\Models\AppSetting;
use App\Models\Subscription;
use App\Services\SubscriptionNotificationService;
use Illuminate\Console\Command;

class NotifyExpiringSubscriptions extends Command
{
    protected $signature = 'subscriptions:notify-expiring
                            {--scheduled : Respect configured alert days and hour in AppSetting}';

    protected $description = 'Send an email alert for subscriptions that are expiring soon or expired';

    public function handle(SubscriptionNotificationService $service): int
    {
        if ($this->option('scheduled') && ! $this->isDueNow()) {
            return Command::SUCCESS;
        }

        $subs = Subscription::query()
            ->where('cancelled', false)
            ->orderBy('end_date')
            ->get();

        $sentCount = $service->notifyExpiringOrExpired($subs);
        if ($this->option('scheduled')) {
            AppSetting::updateOrCreate(
                ['key' => 'subscription_last_notified_date'],
                ['value' => now()->toDateString()],
            );
        }

        if ($sentCount === 0) {
            $this->info('لا توجد اشتراكات منتهية أو قاربت على الانتهاء (أو لم يتم تحديد مستلمي الاشتراكات في الإعدادات).');

            return Command::SUCCESS;
        }

        $this->info("تم إرسال تنبيه الاشتراكات لعدد ({$sentCount}) اشتراك.");

        return Command::SUCCESS;
    }

    private function isDueNow(): bool
    {
        $stored = AppSetting::query()
            ->whereIn('key', ['subscription_alert_days', 'subscription_alert_time', 'subscription_last_notified_date'])
            ->pluck('value', 'key')
            ->toArray();

        $todayDate = now()->toDateString();
        if (($stored['subscription_last_notified_date'] ?? null) === $todayDate) {
            return false;
        }

        $days = json_decode((string) ($stored['subscription_alert_days'] ?? ''), true);
        if (! is_array($days)) {
            $days = ['sun', 'mon', 'tue', 'wed', 'thu'];
        }

        $todayDay = strtolower(now()->format('D'));
        if (! in_array($todayDay, $days, true)) {
            return false;
        }

        $targetTime = (string) ($stored['subscription_alert_time'] ?? '09:00');
        if (! preg_match('/^([01]\d|2[0-3]):[0-5]\d$/', $targetTime)) {
            $targetTime = '09:00';
        }

        return now()->format('H:i') >= $targetTime;
    }
}
