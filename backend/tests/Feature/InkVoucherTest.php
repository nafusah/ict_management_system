<?php

namespace Tests\Feature;

use App\Models\AppUser;
use App\Models\Ink;
use App\Models\InkVoucher;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class InkVoucherTest extends TestCase
{
    use RefreshDatabase;

    /** @param list<string> $permissions */
    private function tokenFor(string $email, array $permissions): string
    {
        AppUser::create([
            'name' => 'مستخدم '.$email,
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

    private function requesterToken(): string
    {
        return $this->tokenFor('requester@nafusah.com', ['inks.vouchers.view', 'inks.vouchers.create']);
    }

    private function approverToken(): string
    {
        return $this->tokenFor('approver@nafusah.com', ['inks.vouchers.view', 'inks.vouchers.approve']);
    }

    private function makeInk(string $color, int $quantity): Ink
    {
        return Ink::create([
            'brand' => 'HP',
            'model' => "HP 415A {$color}",
            'color' => $color,
            'quantity' => $quantity,
            'alert_threshold' => 2,
        ]);
    }

    /** @param list<array{inkId: string, quantity: int}> $items */
    private function createVoucher(string $token, array $items, array $extra = []): \Illuminate\Testing\TestResponse
    {
        return $this->withToken($token)->postJson('/api/ink-vouchers', array_merge([
            'department' => 'إدارة المالية',
            'items' => $items,
        ], $extra));
    }

    // ---------------------------------------------------------------
    // إنشاء الإذن
    // ---------------------------------------------------------------

    public function test_creating_voucher_is_pending_and_does_not_touch_stock(): void
    {
        $black = $this->makeInk('black', 10);

        $response = $this->createVoucher($this->requesterToken(), [
            ['inkId' => $black->id, 'quantity' => 3],
        ]);

        $response->assertCreated()
            ->assertJsonPath('status', 'pending')
            ->assertJsonPath('scope', 'shared')
            ->assertJsonPath('department', 'إدارة المالية');

        $this->assertStringStartsWith('VCH', $response->json('id'));
        $this->assertSame(10, $black->fresh()->quantity);
        $this->assertDatabaseCount('ink_dispenses', 0);
    }

    public function test_duplicate_lines_for_same_ink_are_merged(): void
    {
        $black = $this->makeInk('black', 10);

        $response = $this->createVoucher($this->requesterToken(), [
            ['inkId' => $black->id, 'quantity' => 2],
            ['inkId' => $black->id, 'quantity' => 3],
        ]);

        $response->assertCreated()->assertJsonCount(1, 'items');
        $this->assertSame(5, $response->json('items.0.quantity'));
    }

    public function test_voucher_cannot_request_more_than_stock(): void
    {
        $black = $this->makeInk('black', 2);

        $this->createVoucher($this->requesterToken(), [
            ['inkId' => $black->id, 'quantity' => 3],
        ])->assertStatus(422);

        $this->assertDatabaseCount('ink_vouchers', 0);
    }

    public function test_personal_voucher_requires_recipient_name(): void
    {
        $black = $this->makeInk('black', 5);
        $token = $this->requesterToken();

        $this->createVoucher($token, [['inkId' => $black->id, 'quantity' => 1]], [
            'scope' => 'personal',
        ])->assertStatus(422);

        $this->createVoucher($token, [['inkId' => $black->id, 'quantity' => 1]], [
            'scope' => 'personal',
            'recipientName' => 'علي محمد',
        ])->assertCreated()
            ->assertJsonPath('scope', 'personal')
            ->assertJsonPath('recipientName', 'علي محمد');
    }

    public function test_view_only_user_cannot_create_voucher(): void
    {
        $black = $this->makeInk('black', 5);
        $token = $this->tokenFor('viewer@nafusah.com', ['inks.vouchers.view']);

        $this->createVoucher($token, [['inkId' => $black->id, 'quantity' => 1]])
            ->assertForbidden();
    }

    // ---------------------------------------------------------------
    // الاعتماد والصرف
    // ---------------------------------------------------------------

    public function test_approver_dispenses_voucher_and_stock_is_deducted(): void
    {
        $black = $this->makeInk('black', 10);
        $cyan = $this->makeInk('cyan', 4);

        $voucherId = $this->createVoucher($this->requesterToken(), [
            ['inkId' => $black->id, 'quantity' => 2],
            ['inkId' => $cyan->id, 'quantity' => 1],
        ])->json('id');

        $this->withToken($this->approverToken())
            ->postJson("/api/ink-vouchers/{$voucherId}/dispense")
            ->assertOk()
            ->assertJsonPath('voucher.status', 'dispensed')
            ->assertJsonCount(2, 'inks');

        $this->assertSame(8, $black->fresh()->quantity);
        $this->assertSame(3, $cyan->fresh()->quantity);
        $this->assertDatabaseCount('ink_dispenses', 2);

        $voucher = InkVoucher::findOrFail($voucherId);
        $this->assertNotNull($voucher->dispensed_at);
        $this->assertSame('مستخدم approver@nafusah.com', $voucher->approved_by_name);
    }

    public function test_voucher_cannot_be_dispensed_twice(): void
    {
        $black = $this->makeInk('black', 10);
        $voucherId = $this->createVoucher($this->requesterToken(), [
            ['inkId' => $black->id, 'quantity' => 4],
        ])->json('id');

        $approver = $this->approverToken();
        $this->withToken($approver)->postJson("/api/ink-vouchers/{$voucherId}/dispense")->assertOk();
        $this->withToken($approver)->postJson("/api/ink-vouchers/{$voucherId}/dispense")->assertStatus(422);

        $this->assertSame(6, $black->fresh()->quantity);
        $this->assertDatabaseCount('ink_dispenses', 1);
    }

    public function test_dispense_rolls_back_if_stock_dropped_after_voucher_was_created(): void
    {
        $black = $this->makeInk('black', 10);
        $cyan = $this->makeInk('cyan', 5);

        $voucherId = $this->createVoucher($this->requesterToken(), [
            ['inkId' => $black->id, 'quantity' => 2],
            ['inkId' => $cyan->id, 'quantity' => 4],
        ])->json('id');

        // صُرف جزء من المخزون بطريقة أخرى قبل الاعتماد
        $cyan->update(['quantity' => 1]);

        $this->withToken($this->approverToken())
            ->postJson("/api/ink-vouchers/{$voucherId}/dispense")
            ->assertStatus(422);

        $this->assertSame(10, $black->fresh()->quantity);
        $this->assertSame(1, $cyan->fresh()->quantity);
        $this->assertDatabaseCount('ink_dispenses', 0);
        $this->assertSame('pending', InkVoucher::findOrFail($voucherId)->status);
    }

    public function test_requester_cannot_approve_own_voucher(): void
    {
        $black = $this->makeInk('black', 10);
        $token = $this->requesterToken();
        $voucherId = $this->createVoucher($token, [['inkId' => $black->id, 'quantity' => 1]])->json('id');

        $this->withToken($token)->postJson("/api/ink-vouchers/{$voucherId}/dispense")->assertForbidden();
        $this->withToken($token)->postJson("/api/ink-vouchers/{$voucherId}/reject")->assertForbidden();

        $this->assertSame(10, $black->fresh()->quantity);
    }

    // ---------------------------------------------------------------
    // الرفض
    // ---------------------------------------------------------------

    public function test_rejected_voucher_keeps_stock_and_cannot_be_dispensed(): void
    {
        $black = $this->makeInk('black', 10);
        $voucherId = $this->createVoucher($this->requesterToken(), [
            ['inkId' => $black->id, 'quantity' => 3],
        ])->json('id');

        $approver = $this->approverToken();
        $this->withToken($approver)
            ->postJson("/api/ink-vouchers/{$voucherId}/reject", ['notes' => 'الكمية كبيرة'])
            ->assertOk()
            ->assertJsonPath('voucher.status', 'rejected')
            ->assertJsonPath('voucher.notes', 'الكمية كبيرة');

        $this->withToken($approver)->postJson("/api/ink-vouchers/{$voucherId}/dispense")->assertStatus(422);
        $this->withToken($approver)->postJson("/api/ink-vouchers/{$voucherId}/reject")->assertStatus(422);

        $this->assertSame(10, $black->fresh()->quantity);
    }

    // ---------------------------------------------------------------
    // الحذف
    // ---------------------------------------------------------------

    public function test_requester_can_delete_own_pending_voucher_only(): void
    {
        $black = $this->makeInk('black', 10);
        $mine = $this->createVoucher($this->requesterToken(), [['inkId' => $black->id, 'quantity' => 1]])->json('id');

        $other = $this->tokenFor('other@nafusah.com', ['inks.vouchers.create']);
        $theirs = $this->createVoucher($other, [['inkId' => $black->id, 'quantity' => 1]])->json('id');

        // نسجل الدخول مجدداً بصاحب الإذن الأول
        $requester = $this->postJson('/api/auth/login', [
            'email' => 'requester@nafusah.com',
            'password' => 'secret123',
        ])->json('token');

        $this->withToken($requester)->deleteJson("/api/ink-vouchers/{$theirs}")->assertForbidden();
        $this->withToken($requester)->deleteJson("/api/ink-vouchers/{$mine}")->assertOk();

        $this->assertDatabaseMissing('ink_vouchers', ['id' => $mine]);
        $this->assertDatabaseHas('ink_vouchers', ['id' => $theirs]);
    }

    public function test_dispensed_voucher_cannot_be_deleted(): void
    {
        $black = $this->makeInk('black', 10);
        $voucherId = $this->createVoucher($this->requesterToken(), [['inkId' => $black->id, 'quantity' => 1]])->json('id');

        $approver = $this->approverToken();
        $this->withToken($approver)->postJson("/api/ink-vouchers/{$voucherId}/dispense")->assertOk();
        $this->withToken($approver)->deleteJson("/api/ink-vouchers/{$voucherId}")->assertStatus(422);

        $this->assertDatabaseHas('ink_vouchers', ['id' => $voucherId, 'status' => 'dispensed']);
    }
}
