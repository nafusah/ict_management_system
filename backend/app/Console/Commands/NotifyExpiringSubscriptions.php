<?php

namespace App\Console\Commands;

use App\Models\Subscription;
use App\Services\SubscriptionNotificationService;
use Illuminate\Console\Command;

class NotifyExpiringSubscriptions extends Command
{
    protected $signature = 'subscriptions:notify-expiring';

    protected $description = 'Send an email alert for subscriptions that are expiring soon or expired';

    public function handle(SubscriptionNotificationService $service): int
    {
        $subs = Subscription::query()
            ->where('cancelled', false)
            ->orderBy('end_date')
            ->get();

        $sentCount = $service->notifyExpiringOrExpired($subs);
        if ($sentCount === 0) {
            $this->info('لا توجد اشتراكات منتهية أو قاربت على الانتهاء (أو لم يتم تحديد مستلمي الاشتراكات في الإعدادات).');

            return Command::SUCCESS;
        }

        $this->info("تم إرسال تنبيه الاشتراكات لعدد ({$sentCount}) اشتراك.");

        return Command::SUCCESS;
    }
}
