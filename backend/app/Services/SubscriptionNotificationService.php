<?php

namespace App\Services;

use App\Mail\SubscriptionAlertMail;
use App\Models\AppSetting;
use App\Models\AppUser;
use App\Models\Subscription;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

class SubscriptionNotificationService
{
    /**
     * @param  iterable<int, Subscription>  $subscriptions
     */
    public function notifyExpiringOrExpired(iterable $subscriptions): int
    {
        [$to, $cc, $orgName] = $this->loadRecipients();
        if (empty($to)) {
            return 0;
        }

        $today = Carbon::today();
        $items = [];
        $hasExpired = false;

        foreach ($subscriptions as $sub) {
            if ($sub->cancelled || $sub->status === 'cancelled' || ! $sub->end_date) {
                continue;
            }

            $endDate = Carbon::parse($sub->end_date)->startOfDay();
            $days = (int) $today->diffInDays($endDate, false);
            $alertDays = (int) ($sub->alert_days_before ?? 30);

            if ($days > $alertDays) {
                continue;
            }

            $isExpired = $days < 0;
            if ($isExpired) {
                $hasExpired = true;
            }

            $items[] = [
                'serviceName' => (string) $sub->service_name,
                'provider' => (string) $sub->provider,
                'location' => $sub->service_location ?: ($sub->department ?: null),
                'poNumber' => $sub->po_number ?: null,
                'endDate' => $endDate->toDateString(),
                'daysRemaining' => $days,
                'statusLabel' => $days < 0
                    ? 'منتهي منذ '.abs($days).' يوم'
                    : ($days === 0 ? 'ينتهي اليوم' : "متبقي {$days} يوم"),
                'isExpired' => $isExpired,
            ];
        }

        if (empty($items)) {
            return 0;
        }

        $count = count($items);
        $title = $count === 1
            ? "تنبيه اشتراك ({$items[0]['serviceName']}): {$items[0]['statusLabel']}"
            : "تنبيه الاشتراكات والتراخيص ({$count} اشتراكات تحتاج للمتابعة)";

        try {
            $mailer = Mail::mailer('msgraph')->to($to);
            if (! empty($cc)) {
                $mailer->cc($cc);
            }
            $mailer->send(new SubscriptionAlertMail([
                'orgName' => $orgName,
                'title' => $title,
                'subtitle' => 'يرجى مراجعة الاشتراكات والتراخيص التالية لاتخاذ إجراءات التجديد اللازمة:',
                'tone' => $hasExpired ? 'red' : 'amber',
                'items' => $items,
            ]));

            return $count;
        } catch (Throwable $e) {
            Log::warning('Failed to send subscription expiry notification email.', [
                'error' => $e->getMessage(),
                'count' => $count,
            ]);

            return 0;
        }
    }

    public function notifyChange(Subscription $sub, string $actionLabel, ?AppUser $performedBy): void
    {
        [$to, $cc, $orgName] = $this->loadRecipients();
        if (empty($to) || ! $sub->end_date) {
            return;
        }

        $today = Carbon::today();
        $endDate = Carbon::parse($sub->end_date)->startOfDay();
        $days = (int) $today->diffInDays($endDate, false);
        $isExpired = ! $sub->cancelled && $days < 0;

        $statusLabel = $sub->cancelled || $sub->status === 'cancelled'
            ? 'ملغي'
            : ($days < 0
                ? 'منتهي منذ '.abs($days).' يوم'
                : ($days === 0 ? 'ينتهي اليوم' : "ساري (متبقي {$days} يوم)"));

        $actor = $performedBy?->name ?? 'النظام';

        try {
            $mailer = Mail::mailer('msgraph')->to($to);
            if (! empty($cc)) {
                $mailer->cc($cc);
            }
            $mailer->send(new SubscriptionAlertMail([
                'orgName' => $orgName,
                'title' => "{$actionLabel}: {$sub->service_name}",
                'subtitle' => "تم تنفيذ ({$actionLabel}) بواسطة {$actor}، وفيما يلي تفاصيل الاشتراك:",
                'tone' => $isExpired ? 'red' : 'slate',
                'items' => [[
                    'serviceName' => (string) $sub->service_name,
                    'provider' => (string) $sub->provider,
                    'location' => $sub->service_location ?: ($sub->department ?: null),
                    'poNumber' => $sub->po_number ?: null,
                    'endDate' => $endDate->toDateString(),
                    'daysRemaining' => $days,
                    'statusLabel' => $statusLabel,
                    'isExpired' => $isExpired,
                ]],
            ]));
        } catch (Throwable $e) {
            Log::warning('Failed to send subscription change notification email.', [
                'error' => $e->getMessage(),
                'subscription_id' => $sub->id,
            ]);
        }
    }

    /**
     * @return array{0: list<string>, 1: list<string>, 2: string}
     */
    private function loadRecipients(): array
    {
        $stored = AppSetting::query()->pluck('value', 'key')->toArray();
        $to = $this->parseEmails($stored['subscription_to_emails'] ?? null);
        $cc = $this->parseEmails($stored['subscription_cc_emails'] ?? null);
        $orgName = $stored['org_name'] ?? 'إدارة الاتصالات وتقنية المعلومات';

        return [$to, $cc, $orgName];
    }

    /**
     * @return list<string>
     */
    private function parseEmails(?string $raw): array
    {
        if (! $raw) {
            return [];
        }

        $decoded = json_decode($raw, true);
        if (! is_array($decoded)) {
            return [];
        }

        $clean = [];
        foreach ($decoded as $email) {
            if (! is_string($email)) {
                continue;
            }
            $normalized = mb_strtolower(trim($email));
            if ($normalized !== '' && filter_var($normalized, FILTER_VALIDATE_EMAIL)) {
                $clean[$normalized] = $normalized;
            }
        }

        return array_values($clean);
    }
}
