<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ink_vouchers', function (Blueprint $table) {
            $table->string('id', 32)->primary();
            $table->string('department')->index();
            $table->string('requester_id', 32)->nullable()->index();
            $table->string('requester_name');
            $table->enum('status', ['pending', 'dispensed', 'rejected'])->default('pending')->index();
            $table->json('items');
            $table->text('notes')->nullable();
            $table->string('approved_by_id', 32)->nullable();
            $table->string('approved_by_name')->nullable();
            $table->timestamp('dispensed_at')->nullable();
            $table->date('date');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ink_vouchers');
    }
};
