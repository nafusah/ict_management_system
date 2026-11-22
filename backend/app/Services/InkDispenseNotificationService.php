<?php

namespace App\Services;

use App\Mail\EmployeeInkDispensedMail;
use App\Mail\InkDispensedMail;
use App\Mail\InkLowStockMail;
use App\Mail\InkRestockedMail;
use App\Models\AppSetting;
use App\Models\AppUser;
use App\Models\Ink;
use App\Models\InkColor;
use App\Models\PrinterType;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

class InkDispenseNotificationService
{
    /**
     * @param  list<array{ink: Ink, quantity: int}>  $dispensedEntries
     */
    public function notify(
        array $dispensedEntries,
        string $department,
        string $scope,
        ?string $recipientName,
        string $date,
        ?AppUser $performedBy,
        string $operationLabel,
        ?string $voucherId = null,
        ?string $requesterName = null,
        ?string $notes = null,
        ?string $recipientEmail = null,
    ): void {
        if (empty($dispensedEntries)) {
            return;
        }

        $stored = AppSetting::query()->pluck('value', 'key')->toArray();
        $to = $this->parseEmails($stored['notification_to_emails'] ?? null);
        $normalizedEmployeeEmail = $recipientEmail ? mb_strtolower(trim($recipientEmail)) : '';
        $hasValidEmployeeEmail = $normalizedEmployeeEmail !== '' && filter_var($normalizedEmployeeEmail, FILTER_VALIDATE_EMAIL);

        if (empty($to) && ! $hasValidEmployeeEmail) {
            return;
        }

        $cc = $this->parseEmails($stored['notification_cc_emails'] ?? null);
        $orgName = $stored['org_name'] ?? 'إدارة الاتصالات وتقنية المعلومات';

        $colorMap = InkColor::query()->pluck('name', 'id')->toArray();
        $printerTypeMap = PrinterType::query()->pluck('name', 'id')->toArray();

        $items = [];
        foreach ($dispensedEntries as $entry) {
            $ink = $entry['ink'];
            $qty = (int) $entry['quantity'];
            $remaining = (int) $ink->quantity;
            $threshold = (int) $ink->alert_threshold;

            $items[] = [
                'model' => (string) $ink->model,
                'brand' => (string) $ink->brand,
                'colorName' => $colorMap[$ink->color] ?? (string) $ink->color,
                'printerTypeName' => $ink->printer_type_id ? ($printerTypeMap[$ink->printer_type_id] ?? null) : null,
                'dispensedQty' => $qty,
                'remainingQty' => $remaining,
                'alertThreshold' => $threshold,
                'isLowStock' => $remaining <= $threshold,
            ];
        }

        $details = [
            'orgName' => $orgName,
            'operationLabel' => $operationLabel,
            'voucherId' => $voucherId,
            'requesterName' => $requesterName,
            'department' => $department,
            'scopeLabel' => $scope === 'personal' ? 'شخصي (موظف محدد)' : 'مشترك / جماعي',
            'recipientName' => $scope === 'personal' ? $recipientName : null,
            'date' => $date,
            'performedBy' => $performedBy?->name ?? 'النظام',
            'notes' => $notes,
            'items' => $items,
        ];

        if (! empty($to)) {
            try {
                $mailer = Mail::mailer('msgraph')->to($to);
                if (! empty($cc)) {
                    $mailer->cc($cc);
                }
                $mailer->send(new InkDispensedMail($details));
            } catch (Throwable $e) {
                Log::warning('Failed to send ink dispense notification email.', [
                    'error' => $e->getMessage(),
                    'department' => $department,
                    'voucher_id' => $voucherId,
                ]);
            }
        }

        if ($hasValidEmployeeEmail) {
            try {
                Mail::mailer('msgraph')
                    ->to($normalizedEmployeeEmail)
                    ->send(new EmployeeInkDispensedMail($details));
            } catch (Throwable $e) {
                Log::warning('Failed to send employee ink dispense notification email.', [
                    'error' => $e->getMessage(),
                    'recipient_email' => $normalizedEmployeeEmail,
                ]);
            }
        }

        $lowStockInks = [];
        foreach ($dispensedEntries as $entry) {
            $ink = $entry['ink'];
            if ((int) $ink->quantity <= (int) $ink->alert_threshold) {
                $lowStockInks[$ink->id] = $ink;
            }
        }
        if (! empty($lowStockInks)) {
            $this->notifyLowStock(array_values($lowStockInks));
        }
    }

    /**
     * Send a low-stock alert email for inks at or below their alert_threshold.
     *
     * @param  iterable<int, Ink>  $inks
     */
    public function notifyLowStock(iterable $inks): int
    {
        $stored = AppSetting::query()->pluck('value', 'key')->toArray();
        $to = $this->parseEmails($stored['notification_to_emails'] ?? null);
        if (empty($to)) {
            return 0;
        }

        $cc = $this->parseEmails($stored['notification_cc_emails'] ?? null);
        $orgName = $stored['org_name'] ?? 'إدارة الاتصالات وتقنية المعلومات';

        $colorMap = InkColor::query()->pluck('name', 'id')->toArray();
        $printerTypeMap = PrinterType::query()->pluck('name', 'id')->toArray();

        $items = [];
        foreach ($inks as $ink) {
            if ((int) $ink->quantity > (int) $ink->alert_threshold) {
                continue;
            }
            $items[] = [
                'id' => (string) $ink->id,
                'model' => (string) $ink->model,
                'brand' => (string) $ink->brand,
                'colorName' => $colorMap[$ink->color] ?? (string) $ink->color,
                'printerTypeName' => $ink->printer_type_id ? ($printerTypeMap[$ink->printer_type_id] ?? null) : null,
                'quantity' => (int) $ink->quantity,
                'alertThreshold' => (int) $ink->alert_threshold,
            ];
        }

        if (empty($items)) {
            return 0;
        }

        try {
            $mailer = Mail::mailer('msgraph')->to($to);
            if (! empty($cc)) {
                $mailer->cc($cc);
            }
            $mailer->send(new InkLowStockMail([
                'orgName' => $orgName,
                'items' => $items,
            ]));

            return count($items);
        } catch (Throwable $e) {
            Log::warning('Failed to send ink low-stock notification email.', [
                'error' => $e->getMessage(),
                'count' => count($items),
            ]);

            return 0;
        }
    }

    public function notifyRestock(
        Ink $ink,
        int $addedQty,
        int $beforeQty,
        int $afterQty,
        ?AppUser $performedBy,
        string $operationLabel = 'توريد / إضافة مخزون حبر',
    ): void {
        if ($addedQty <= 0) {
            return;
        }

        $stored = AppSetting::query()->pluck('value', 'key')->toArray();
        $to = $this->parseEmails($stored['notification_to_emails'] ?? null);
        if (empty($to)) {
            return;
        }

        $cc = $this->parseEmails($stored['notification_cc_emails'] ?? null);
        $orgName = $stored['org_name'] ?? 'إدارة الاتصالات وتقنية المعلومات';

        $colorName = (string) (InkColor::query()->whereKey($ink->color)->value('name') ?? $ink->color);
        $printerTypeName = $ink->printer_type_id
            ? PrinterType::query()->whereKey($ink->printer_type_id)->value('name')
            : null;

        try {
            $mailer = Mail::mailer('msgraph')->to($to);
            if (! empty($cc)) {
                $mailer->cc($cc);
            }
            $mailer->send(new InkRestockedMail([
                'orgName' => $orgName,
                'operationLabel' => $operationLabel,
                'model' => (string) $ink->model,
                'brand' => (string) $ink->brand,
                'colorName' => $colorName,
                'printerTypeName' => $printerTypeName ? (string) $printerTypeName : null,
                'addedQty' => $addedQty,
                'beforeQty' => $beforeQty,
                'afterQty' => $afterQty,
                'performedBy' => $performedBy?->name ?? 'النظام',
                'date' => now()->toDateString(),
            ]));
        } catch (Throwable $e) {
            Log::warning('Failed to send ink restock notification email.', [
                'error' => $e->getMessage(),
                'ink_id' => $ink->id,
            ]);
        }
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
