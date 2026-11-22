<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AppSetting;
use App\Models\AppUser;
use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Throwable;

class SettingController extends Controller
{
    private const DEFAULTS = [
        'org_name' => 'إدارة الاتصالات وتقنية المعلومات',
        'admin_name' => 'مدير النظام',
        'admin_email' => 'it-admin@company.local',
        'default_ink_threshold' => '3',
        'subscription_alert_days' => ['sun', 'mon', 'tue', 'wed', 'thu'],
        'subscription_alert_time' => '09:00',
    ];

    private const WEEKDAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

    public function index(): JsonResponse
    {
        $stored = AppSetting::query()->pluck('value', 'key')->toArray();

        return response()->json([
            'orgName' => $stored['org_name'] ?? self::DEFAULTS['org_name'],
            'adminName' => $stored['admin_name'] ?? self::DEFAULTS['admin_name'],
            'adminEmail' => $stored['admin_email'] ?? self::DEFAULTS['admin_email'],
            'defaultInkThreshold' => (int) ($stored['default_ink_threshold'] ?? self::DEFAULTS['default_ink_threshold']),
            'notificationToEmails' => $this->parseEmailList($stored['notification_to_emails'] ?? null),
            'notificationCcEmails' => $this->parseEmailList($stored['notification_cc_emails'] ?? null),
            'subscriptionToEmails' => $this->parseEmailList($stored['subscription_to_emails'] ?? null),
            'subscriptionCcEmails' => $this->parseEmailList($stored['subscription_cc_emails'] ?? null),
            'subscriptionAlertDays' => $this->parseWeekdays($stored['subscription_alert_days'] ?? null),
            'subscriptionAlertTime' => $this->normalizeTime($stored['subscription_alert_time'] ?? null),
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'orgName' => ['required', 'string', 'max:255'],
            'adminName' => ['required', 'string', 'max:255'],
            'adminEmail' => ['required', 'email', 'max:255'],
            'defaultInkThreshold' => ['required', 'integer', 'min:0'],
            'notificationToEmails' => ['nullable', 'array'],
            'notificationToEmails.*' => ['required', 'email', 'max:255'],
            'notificationCcEmails' => ['nullable', 'array'],
            'notificationCcEmails.*' => ['required', 'email', 'max:255'],
            'subscriptionToEmails' => ['nullable', 'array'],
            'subscriptionToEmails.*' => ['required', 'email', 'max:255'],
            'subscriptionCcEmails' => ['nullable', 'array'],
            'subscriptionCcEmails.*' => ['required', 'email', 'max:255'],
            'subscriptionAlertDays' => ['nullable', 'array'],
            'subscriptionAlertDays.*' => ['required', 'in:sun,mon,tue,wed,thu,fri,sat'],
            'subscriptionAlertTime' => ['nullable', 'regex:/^([01]\d|2[0-3]):[0-5]\d$/'],
        ]);

        $toEmails = $this->normalizeEmails($validated['notificationToEmails'] ?? []);
        $ccEmails = $this->normalizeEmails($validated['notificationCcEmails'] ?? []);
        $subToEmails = $this->normalizeEmails($validated['subscriptionToEmails'] ?? []);
        $subCcEmails = $this->normalizeEmails($validated['subscriptionCcEmails'] ?? []);
        $alertDays = $this->normalizeWeekdays($validated['subscriptionAlertDays'] ?? self::DEFAULTS['subscription_alert_days']);
        $alertTime = $this->normalizeTime($validated['subscriptionAlertTime'] ?? null);

        $pairs = [
            'org_name' => $validated['orgName'],
            'admin_name' => $validated['adminName'],
            'admin_email' => $validated['adminEmail'],
            'default_ink_threshold' => (string) $validated['defaultInkThreshold'],
            'notification_to_emails' => json_encode($toEmails, JSON_UNESCAPED_UNICODE),
            'notification_cc_emails' => json_encode($ccEmails, JSON_UNESCAPED_UNICODE),
            'subscription_to_emails' => json_encode($subToEmails, JSON_UNESCAPED_UNICODE),
            'subscription_cc_emails' => json_encode($subCcEmails, JSON_UNESCAPED_UNICODE),
            'subscription_alert_days' => json_encode($alertDays, JSON_UNESCAPED_UNICODE),
            'subscription_alert_time' => $alertTime,
        ];

        foreach ($pairs as $key => $value) {
            AppSetting::updateOrCreate(['key' => $key], ['value' => $value]);
        }

        /** @var AppUser|null $user */
        $user = $request->attributes->get('app_user');
        AuditLog::record(
            $user,
            'updated',
            'settings',
            'general',
            'تحديث الإعدادات العامة للنظام',
            null,
            $pairs,
            $request,
        );

        return $this->index();
    }

    public function sendTestEmail(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'channel' => ['nullable', 'in:inks,subscriptions'],
            'to' => ['nullable', 'array'],
            'to.*' => ['required', 'email', 'max:255'],
            'cc' => ['nullable', 'array'],
            'cc.*' => ['required', 'email', 'max:255'],
        ]);

        $channel = $validated['channel'] ?? 'inks';
        $toKey = $channel === 'subscriptions' ? 'subscription_to_emails' : 'notification_to_emails';
        $ccKey = $channel === 'subscriptions' ? 'subscription_cc_emails' : 'notification_cc_emails';

        $stored = AppSetting::query()->pluck('value', 'key')->toArray();

        $to = array_key_exists('to', $validated)
            ? $this->normalizeEmails($validated['to'] ?? [])
            : $this->parseEmailList($stored[$toKey] ?? null);

        $cc = array_key_exists('cc', $validated)
            ? $this->normalizeEmails($validated['cc'] ?? [])
            : $this->parseEmailList($stored[$ccKey] ?? null);

        if (empty($to)) {
            return response()->json([
                'message' => 'يرجى إضافة بريد إلكتروني واحد على الأقل في قائمة المستلمين (To) أولاً.',
            ], 422);
        }

        try {
            $orgName = $stored['org_name'] ?? self::DEFAULTS['org_name'];
            $channelLabel = $channel === 'subscriptions' ? 'الاشتراكات والتراخيص' : 'الأحبار';
            $body = "مرحباً،\n\nهذه رسالة تجريبية لإشعارات ({$channelLabel}) من نظام إدارة أصول تقنية المعلومات ({$orgName}) عبر Microsoft Graph OAuth 2.0.\n"
                .'المستلمون (To): '.implode(', ', $to)."\n"
                .(empty($cc) ? '' : 'نسخة إلى (CC): '.implode(', ', $cc)."\n");

            Mail::mailer('msgraph')->raw($body, function ($message) use ($to, $cc, $orgName, $channelLabel) {
                $message->to($to)
                    ->subject("رسالة تجريبية ({$channelLabel}) - {$orgName}");

                if (! empty($cc)) {
                    $message->cc($cc);
                }
            });

            return response()->json([
                'message' => 'تم إرسال البريد التجريبي بنجاح.',
                'to' => $to,
                'cc' => $cc,
            ]);
        } catch (Throwable $e) {
            return response()->json([
                'message' => 'تعذر إرسال البريد التجريبي: '.$e->getMessage(),
            ], 500);
        }
    }

    /**
     * @return list<string>
     */
    private function parseEmailList(?string $raw): array
    {
        if (! $raw) {
            return [];
        }

        $decoded = json_decode($raw, true);
        if (! is_array($decoded)) {
            return [];
        }

        return $this->normalizeEmails($decoded);
    }

    /**
     * @param  array<int, mixed>  $emails
     * @return list<string>
     */
    private function normalizeEmails(array $emails): array
    {
        $clean = [];
        foreach ($emails as $email) {
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

    /**
     * @return list<string>
     */
    private function parseWeekdays(?string $raw): array
    {
        if (! $raw) {
            return self::DEFAULTS['subscription_alert_days'];
        }

        $decoded = json_decode($raw, true);
        if (! is_array($decoded)) {
            return self::DEFAULTS['subscription_alert_days'];
        }

        return $this->normalizeWeekdays($decoded);
    }

    /**
     * @param  array<int, mixed>  $days
     * @return list<string>
     */
    private function normalizeWeekdays(array $days): array
    {
        $valid = [];
        foreach ($days as $day) {
            if (! is_string($day)) {
                continue;
            }
            $d = strtolower(trim($day));
            if (in_array($d, self::WEEKDAYS, true)) {
                $valid[$d] = $d;
            }
        }

        return array_values(array_intersect(self::WEEKDAYS, array_values($valid)));
    }

    private function normalizeTime(?string $time): string
    {
        if (is_string($time) && preg_match('/^([01]\d|2[0-3]):[0-5]\d$/', trim($time))) {
            return trim($time);
        }

        return self::DEFAULTS['subscription_alert_time'];
    }
}
