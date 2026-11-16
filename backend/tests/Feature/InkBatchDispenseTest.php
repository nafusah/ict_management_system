<?php

namespace Tests\Feature;

use App\Models\AppUser;
use App\Models\Ink;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class InkBatchDispenseTest extends TestCase
{
    use RefreshDatabase;

    private function authToken(): string
    {
        AppUser::create([
            'name' => 'مسؤول الأحبار',
            'email' => 'inks@nafusah.com',
            'password' => Hash::make('secret123'),
            'department' => 'تقنية المعلومات',
            'active' => true,
            'permissions' => ['inks.view', 'inks.manage'],
        ]);

        return $this->postJson('/api/auth/login', [
            'email' => 'inks@nafusah.com',
            'password' => 'secret123',
        ])->json('token');
    }

    public function test_batch_dispense_deducts_multiple_inks_for_same_department(): void
    {
        $token = $this->authToken();

        $black = Ink::create([
            'brand' => 'HP',
            'model' => 'HP 415A Black',
            'color' => 'black',
            'quantity' => 10,
            'alert_threshold' => 3,
        ]);

        $cyan = Ink::create([
            'brand' => 'HP',
            'model' => 'HP 415A Cyan',
            'color' => 'cyan',
            'quantity' => 6,
            'alert_threshold' => 3,
        ]);

        $response = $this->withToken($token)->postJson('/api/inks/dispense-batch', [
            'department' => 'إدارة المالية',
            'date' => '2026-11-16',
            'items' => [
                ['inkId' => $black->id, 'quantity' => 2],
                ['inkId' => $cyan->id, 'quantity' => 1],
            ],
        ]);

        $response->assertOk()
            ->assertJsonCount(2, 'inks')
            ->assertJsonCount(2, 'dispenses');

        $this->assertSame(8, $black->fresh()->quantity);
        $this->assertSame(5, $cyan->fresh()->quantity);
        $this->assertDatabaseCount('ink_dispenses', 2);
    }

    public function test_batch_dispense_rolls_back_when_any_item_exceeds_stock(): void
    {
        $token = $this->authToken();

        $black = Ink::create([
            'brand' => 'HP',
            'model' => 'HP 415A Black',
            'color' => 'black',
            'quantity' => 5,
            'alert_threshold' => 2,
        ]);

        $yellow = Ink::create([
            'brand' => 'HP',
            'model' => 'HP 415A Yellow',
            'color' => 'yellow',
            'quantity' => 1,
            'alert_threshold' => 2,
        ]);

        $this->withToken($token)->postJson('/api/inks/dispense-batch', [
            'department' => 'إدارة المالية',
            'items' => [
                ['inkId' => $black->id, 'quantity' => 2],
                ['inkId' => $yellow->id, 'quantity' => 3],
            ],
        ])->assertStatus(422);

        $this->assertSame(5, $black->fresh()->quantity);
        $this->assertSame(1, $yellow->fresh()->quantity);
        $this->assertDatabaseCount('ink_dispenses', 0);
    }
}
