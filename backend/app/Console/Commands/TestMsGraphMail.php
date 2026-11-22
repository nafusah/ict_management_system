<?php

namespace App\Console\Commands;

use App\Models\AppSetting;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Throwable;

class TestMsGraphMail extends Command
{
    protected $signature = 'mail:test-graph {email? : The recipient email address}
                            {--cc=* : Optional CC email address(es)}
                            {--diagnose : Only run network and configuration diagnostics without sending}';

    protected $description = 'Send a simple test email using Microsoft Graph OAuth 2.0';

    public function handle(): int
    {
        $this->diagnose();

        if ($this->option('diagnose')) {
            return Command::SUCCESS;
        }

        $to = trim((string) ($this->argument('email') ?: $this->ask('أدخل البريد الإلكتروني للمستلم (Recipient email)')));

        if (! filter_var($to, FILTER_VALIDATE_EMAIL)) {
            $this->error('عنوان البريد الإلكتروني غير صالح.');

            return Command::FAILURE;
        }

        $storedCc = json_decode((string) AppSetting::query()->where('key', 'notification_cc_emails')->value('value'), true);
        $cc = collect($this->option('cc'))
            ->when(empty($this->option('cc')) && is_array($storedCc), fn ($c) => collect($storedCc))
            ->map(fn ($e) => trim((string) $e))
            ->filter(fn ($e) => filter_var($e, FILTER_VALIDATE_EMAIL))
            ->unique()
            ->values()
            ->all();

        $this->newLine();
        $this->info("Sending test email to: {$to}");
        if (! empty($cc)) {
            $this->info('CC: '.implode(', ', $cc));
        }

        try {
            $appName = config('app.name', 'ICT Management System');

            Mail::mailer('msgraph')->raw(
                "مرحباً،\n\nهذه رسالة تجريبية من نظام {$appName} عبر Microsoft Graph OAuth 2.0.\nتم الإرسال بنجاح.",
                function ($message) use ($to, $cc, $appName) {
                    $message->to($to)
                        ->subject("رسالة تجريبية - {$appName}");

                    if (! empty($cc)) {
                        $message->cc($cc);
                    }
                }
            );

            $this->info('Email sent successfully!');

            return Command::SUCCESS;
        } catch (Throwable $e) {
            $this->error('Failed to send email:');
            $this->line($e->getMessage());

            return Command::FAILURE;
        }
    }

    protected function diagnose(): void
    {
        $proxy = config('services.msgraph.proxy');

        $this->info('=== Mail configuration ===');
        $this->line('MAIL_MAILER        : '.config('mail.default'));
        $this->line('MSGRAPH_USER_ID    : '.(config('services.msgraph.user_id') ?: '(missing)'));
        $this->line('MSGRAPH_TENANT_ID  : '.(config('services.msgraph.tenant_id') ?: '(missing)'));
        $this->line('MSGRAPH_CLIENT_ID  : '.(config('services.msgraph.client_id') ?: '(missing)'));
        $this->line('MSGRAPH_PROXY      : '.($proxy ?: '(none)'));

        $this->newLine();
        $this->info('=== Network connectivity ===');

        foreach (['login.microsoftonline.com', 'graph.microsoft.com'] as $host) {
            $this->checkHost($host, $proxy);
        }
    }

    protected function checkHost(string $host, ?string $proxy): void
    {
        $caBundle = config('services.msgraph.ca_bundle');
        $verifySsl = (bool) config('services.msgraph.verify_ssl', true);

        $options = [
            'timeout' => (int) config('services.msgraph.timeout', 15),
            'connect_timeout' => (int) config('services.msgraph.connect_timeout', 5),
            'verify' => $caBundle ?: $verifySsl,
        ];

        if ($proxy) {
            $options['proxy'] = $proxy;
        }

        try {
            $start = microtime(true);
            $response = Http::withOptions($options)->get("https://{$host}/");
            $ms = round((microtime(true) - $start) * 1000);

            $this->line("  [OK] {$host} reachable (HTTP {$response->status()}, {$ms} ms)");
        } catch (Throwable $e) {
            $this->line("  [FAIL] {$host} UNREACHABLE");
            $this->line('     '.$e->getMessage());
        }
    }
}
