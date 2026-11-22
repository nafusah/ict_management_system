<?php

namespace App\Jobs;

use App\Models\AppSetting;
use App\Models\AuditLog;
use App\Models\Ink;
use App\Models\Subscription;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Mail;

class CheckSystemAlertsJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 2;

    public function handle(): void
    {
        $today = Carbon::today();
        $expiringCount = 0;
        $expiredCount = 0;

        Subscription::query()
            ->where('cancelled', false)
            ->chunkById(100, function ($subs) use ($today, &$expiringCount, &$expiredCount) {
                foreach ($subs as $sub) {
                    $end = Carbon::parse($sub->end_date)->startOfDay();
                    $days = $today->diffInDays($end, false);
                    $alertDays = (int) ($sub->alert_days_before ?? 30);

                    $nextStatus = $days < 0
                        ? 'expired'
                        : ($days <= $alertDays ? 'expiring' : 'active');

                    if ($sub->status !== $nextStatus) {
                        $sub->update(['status' => $nextStatus]);
                    }

                    if ($nextStatus === 'expired') {
                        $expiredCount++;
                    } elseif ($nextStatus === 'expiring') {
                        $expiringCount++;
                    }
                }
            });

        $lowInks = Ink::query()
            ->whereColumn('quantity', '<=', 'alert_threshold')
            ->get(['id', 'model', 'quantity', 'alert_threshold']);

        if ($lowInks->isEmpty() && $expiringCount === 0 && $expiredCount === 0) {
            return;
        }

        $adminEmail = AppSetting::query()->where('key', 'admin_email')->value('value') ?: 'it-admin@nafusah.com';
        $lines = [
            'تنبيهات نظام إدارة تقنية المعلومات:',
            "- أحبار تحت حد الطلب: {$lowInks->count()}",
            "- اشتراكات قاربت على الانتهاء: {$expiringCount}",
            "- اشتراكات منتهية: {$expiredCount}",
        ];

        foreach ($lowInks as $ink) {
            $lines[] = "  * {$ink->model} (المتوفر: {$ink->quantity} / حد التنبيه: {$ink->alert_threshold})";
        }

        Mail::raw(implode("\n", $lines), function ($message) use ($adminEmail) {
            $message->to($adminEmail)->subject('تقرير التنبيهات اليومي — نظام إدارة أصول IT');
        });

        AuditLog::record(
            null,
            'updated',
            'system',
            'alerts',
            "فحص التنبيهات اليومي: {$lowInks->count()} حبر منخفض، {$expiringCount} اشتراك قريب الانتهاء، {$expiredCount} منتهي",
        );
    }
}
