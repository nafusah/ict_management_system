<?php

namespace App\Console\Commands;

use App\Models\Ink;
use App\Services\InkDispenseNotificationService;
use Illuminate\Console\Command;

class NotifyLowStockInks extends Command
{
    protected $signature = 'inks:notify-low-stock';

    protected $description = 'Send an email alert for all inks whose quantity is at or below alert_threshold';

    public function handle(InkDispenseNotificationService $service): int
    {
        $lowInks = Ink::query()
            ->whereColumn('quantity', '<=', 'alert_threshold')
            ->orderBy('quantity')
            ->get();

        if ($lowInks->isEmpty()) {
            $this->info('جميع أصناف الأحبار فوق حد التنبيه.');

            return Command::SUCCESS;
        }

        $sentCount = $service->notifyLowStock($lowInks);
        if ($sentCount === 0) {
            $this->warn('لم يتم إرسال التنبيه: تأكد من إضافة عناوين (To) في إعدادات النظام أو راجع سجل الأخطاء.');

            return Command::FAILURE;
        }

        $this->info("تم إرسال تنبيه نقص المخزون لعدد ({$sentCount}) صنف حبر.");

        return Command::SUCCESS;
    }
}
