<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('departments', function (Blueprint $table) {
            $table->string('id', 32)->primary();
            $table->string('name')->unique();
            $table->timestamps();
        });

        Schema::create('employees', function (Blueprint $table) {
            $table->string('id', 32)->primary();
            $table->string('name');
            $table->string('department')->index();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('app_settings', function (Blueprint $table) {
            $table->string('key', 64)->primary();
            $table->text('value')->nullable();
            $table->timestamps();
        });

        Schema::table('subscriptions', function (Blueprint $table) {
            $table->string('po_number')->default('')->after('category');
            $table->unsignedInteger('alert_days_before')->default(30)->after('end_date');
            $table->boolean('cancelled')->default(false)->after('status');
        });
    }

    public function down(): void
    {
        Schema::table('subscriptions', function (Blueprint $table) {
            $table->dropColumn(['po_number', 'alert_days_before', 'cancelled']);
        });

        Schema::dropIfExists('app_settings');
        Schema::dropIfExists('employees');
        Schema::dropIfExists('departments');
    }
};
