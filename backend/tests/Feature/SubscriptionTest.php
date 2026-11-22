<?php

namespace Tests\Feature;

use App\Jobs\CheckSystemAlertsJob;
use App\Mail\SubscriptionAlertMail;
use App\Models\AppSetting;
use App\Models\AppUser;
use App\Models\Subscription;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class SubscriptionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Carbon::setTestNow('2026-11-22 10:00:00');
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    /** @param list<string> $permissions */
    private function tokenFor(array $permissions, string $email = 'subs@nafusah.com'): string
    {
        AppUser::create([
            'name' => 'مسؤول الاشتراكات',
            'email' => $email,
            'password' => Hash::make('secret123'),
            'department' => 'تقنية المعلومات',
            'active' => true,
            'permissions' => $permissions,
        ]);

        return $this->postJson('/api/auth/login', [
            'email' => $email,
            'password' => 'secret123',
        ])->json('token');
    }

    private function managerToken(): string
    {
        return $this->tokenFor(['subscriptions.view', 'subscriptions.manage']);
    }

    /** @return array<string, mixed> */
    private function payload(array $overrides = []): array
    {
        return array_merge([
            'serviceName' => 'Microsoft 365 Business Standard',
            'provider' => 'شركة التقنية الحديثة',
            'category' => 'licenses',
            'startDate' => '2026-01-01',
            'endDate' => '2027-01-01',
            'alertDaysBefore' => 30,
            'seats' => 50,
            'annualCost' => 12000,
        ], $overrides);
    }

    private function enableSubscriptionEmails(): void
    {
        AppSetting::create(['key' => 'subscription_to_emails', 'value' => json_encode(['it@nafusah.com'])]);
    }

    private function makeSubscription(string $endDate, array $extra = []): Subscription
    {
        return Subscription::create(array_merge([
            'service_name' => 'Service ending '.$endDate,
            'provider' => 'Provider',
            'category' => 'licenses',
            'end_date' => $endDate,
            'alert_days_before' => 30,
            'status' => 'active',
            'cancelled' => false,
        ], $extra));
    }

    // ---------------------------------------------------------------
    // CRUD والصلاحيات
    // ---------------------------------------------------------------

    public function test_manager_can_create_subscription_with_camel_case_payload(): void
    {
        $response = $this->withToken($this->managerToken())
            ->postJson('/api/subscriptions', $this->payload());

        $response->assertCreated()
            ->assertJsonPath('serviceName', 'Microsoft 365 Business Standard')
            ->assertJsonPath('endDate', '2027-01-01')
            ->assertJsonPath('seats', 50);

        $this->assertStringStartsWith('SUB', $response->json('id'));
        $this->assertDatabaseHas('subscriptions', ['service_name' => 'Microsoft 365 Business Standard']);
    }

    public function test_end_date_must_not_be_before_start_date(): void
    {
        $this->withToken($this->managerToken())
            ->postJson('/api/subscriptions', $this->payload(['startDate' => '2026-06-01', 'endDate' => '2026-05-01']))
            ->assertStatus(422);

        $this->assertDatabaseCount('subscriptions', 0);
    }

    public function test_required_fields_are_validated(): void
    {
        $this->withToken($this->managerToken())
            ->postJson('/api/subscriptions', [])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['service_name', 'provider', 'category', 'end_date']);
    }

    public function test_view_only_user_can_list_but_not_modify(): void
    {
        $sub = $this->makeSubscription('2027-01-01');
        $token = $this->tokenFor(['subscriptions.view'], 'viewer@nafusah.com');

        $this->withToken($token)->getJson('/api/subscriptions')->assertOk()->assertJsonCount(1);
        $this->withToken($token)->postJson('/api/subscriptions', $this->payload())->assertForbidden();
        $this->withToken($token)->putJson("/api/subscriptions/{$sub->id}", $this->payload())->assertForbidden();
        $this->withToken($token)->deleteJson("/api/subscriptions/{$sub->id}")->assertForbidden();
    }

    public function test_user_without_subscription_permissions_cannot_list(): void
    {
        $token = $this->tokenFor(['inks.view'], 'inks@nafusah.com');

        $this->withToken($token)->getJson('/api/subscriptions')->assertForbidden();
    }

    public function test_delete_is_soft_and_hides_subscription_from_list(): void
    {
        $sub = $this->makeSubscription('2027-01-01');
        $token = $this->managerToken();

        $this->withToken($token)->deleteJson("/api/subscriptions/{$sub->id}")->assertOk();

        $this->withToken($token)->getJson('/api/subscriptions')->assertOk()->assertJsonCount(0);
        $this->assertSoftDeleted('subscriptions', ['id' => $sub->id]);
    }

    // ---------------------------------------------------------------
    // إشعارات التغيير
    // ---------------------------------------------------------------

    public function test_creating_subscription_sends_change_email_when_recipients_configured(): void
    {
        Mail::fake();
        $this->enableSubscriptionEmails();

        $this->withToken($this->managerToken())
            ->postJson('/api/subscriptions', $this->payload())
            ->assertCreated();

        Mail::assertSent(SubscriptionAlertMail::class, function (SubscriptionAlertMail $mail) {
            return $mail->hasTo('it@nafusah.com')
                && str_contains($mail->details['title'], 'إضافة اشتراك جديد');
        });
    }

    public function test_no_email_is_sent_when_recipients_not_configured(): void
    {
        Mail::fake();

        $this->withToken($this->managerToken())
            ->postJson('/api/subscriptions', $this->payload())
            ->assertCreated();

        Mail::assertNothingSent();
    }

    public function test_renewal_sends_email_but_minor_edit_does_not(): void
    {
        Mail::fake();
        $this->enableSubscriptionEmails();
        $sub = $this->makeSubscription('2027-01-01', ['start_date' => '2026-01-01']);
        $token = $this->managerToken();

        // تعديل الملاحظات فقط — بدون إشعار
        $this->withToken($token)
            ->putJson("/api/subscriptions/{$sub->id}", $this->payload(['notes' => 'ملاحظة جديدة']))
            ->assertOk();
        Mail::assertNothingSent();

        // تجديد (تغيير تاريخ الانتهاء) — يرسل إشعار
        $this->withToken($token)
            ->putJson("/api/subscriptions/{$sub->id}", $this->payload(['endDate' => '2028-01-01']))
            ->assertOk()
            ->assertJsonPath('endDate', '2028-01-01');

        Mail::assertSent(SubscriptionAlertMail::class, fn (SubscriptionAlertMail $mail) => str_contains($mail->details['title'], 'تجديد'));
    }

    // ---------------------------------------------------------------
    // تحديث الحالات وتنبيهات الانتهاء
    // ---------------------------------------------------------------

    public function test_daily_job_updates_statuses_based_on_end_date(): void
    {
        Mail::fake();
        $active = $this->makeSubscription('2027-06-01');
        $expiring = $this->makeSubscription('2026-12-10');               // بعد 18 يوم (حد التنبيه 30)
        $expired = $this->makeSubscription('2026-11-01');                // منتهي
        $cancelled = $this->makeSubscription('2026-10-01', ['cancelled' => true, 'status' => 'cancelled']);

        (new CheckSystemAlertsJob)->handle();

        $this->assertSame('active', $active->fresh()->status);
        $this->assertSame('expiring', $expiring->fresh()->status);
        $this->assertSame('expired', $expired->fresh()->status);
        $this->assertSame('cancelled', $cancelled->fresh()->status);
    }

    public function test_expiry_command_emails_only_subscriptions_inside_alert_window(): void
    {
        Mail::fake();
        $this->enableSubscriptionEmails();

        $this->makeSubscription('2027-06-01', ['service_name' => 'Far Away']);
        $this->makeSubscription('2026-12-10', ['service_name' => 'Soon']);
        $this->makeSubscription('2026-11-01', ['service_name' => 'Expired']);
        $this->makeSubscription('2026-11-25', ['service_name' => 'Cancelled', 'cancelled' => true]);

        $this->artisan('subscriptions:notify-expiring')->assertSuccessful();

        Mail::assertSent(SubscriptionAlertMail::class, 1);
        Mail::assertSent(SubscriptionAlertMail::class, function (SubscriptionAlertMail $mail) {
            $names = array_column($mail->details['items'], 'serviceName');
            sort($names);

            return $names === ['Expired', 'Soon'] && $mail->details['tone'] === 'red';
        });
    }

    public function test_scheduled_expiry_command_runs_once_per_day(): void
    {
        Mail::fake();
        $this->enableSubscriptionEmails();
        AppSetting::create(['key' => 'subscription_alert_days', 'value' => json_encode(['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'])]);
        AppSetting::create(['key' => 'subscription_alert_time', 'value' => '09:00']);
        $this->makeSubscription('2026-12-01');

        $this->artisan('subscriptions:notify-expiring --scheduled')->assertSuccessful();
        $this->artisan('subscriptions:notify-expiring --scheduled')->assertSuccessful();

        Mail::assertSent(SubscriptionAlertMail::class, 1);
        $this->assertSame('2026-11-22', AppSetting::find('subscription_last_notified_date')?->value);
    }

    public function test_scheduled_expiry_command_waits_for_configured_time(): void
    {
        Mail::fake();
        $this->enableSubscriptionEmails();
        AppSetting::create(['key' => 'subscription_alert_days', 'value' => json_encode(['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'])]);
        AppSetting::create(['key' => 'subscription_alert_time', 'value' => '11:30']);
        $this->makeSubscription('2026-12-01');

        $this->artisan('subscriptions:notify-expiring --scheduled')->assertSuccessful();

        Mail::assertNothingSent();
    }
}
