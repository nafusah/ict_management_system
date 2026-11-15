<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('device_types', function (Blueprint $table) {
            $table->string('id', 32)->primary();
            $table->string('label');
            $table->string('icon', 32)->default('other');
            $table->timestamps();
        });

        Schema::create('brands', function (Blueprint $table) {
            $table->string('id', 32)->primary();
            $table->string('name');
            $table->enum('category', ['device', 'ink'])->index();
            $table->timestamps();
        });

        Schema::create('devices', function (Blueprint $table) {
            $table->string('id', 32)->primary();
            $table->string('name');
            $table->string('serial_number')->unique();
            $table->string('kind', 32)->index();
            $table->string('brand');
            $table->string('department')->index();
            $table->string('employee');
            $table->enum('classification', ['personal', 'shared'])->default('personal');
            $table->enum('location', ['town', 'field'])->default('town');
            $table->string('floor', 32)->nullable();
            $table->string('office_number', 32)->nullable();
            $table->timestamps();
        });

        Schema::create('ink_colors', function (Blueprint $table) {
            $table->string('id', 32)->primary();
            $table->string('name');
            $table->string('code', 16);
            $table->string('primary', 16);
            $table->string('light', 16);
            $table->string('border', 16);
            $table->timestamps();
        });

        Schema::create('inks', function (Blueprint $table) {
            $table->string('id', 32)->primary();
            $table->string('brand');
            $table->string('model');
            $table->string('color', 32)->index();
            $table->unsignedInteger('quantity')->default(0);
            $table->unsignedInteger('alert_threshold')->default(0);
            $table->timestamps();
        });

        Schema::create('ink_dispenses', function (Blueprint $table) {
            $table->string('id', 32)->primary();
            $table->string('ink_id', 32)->index();
            $table->string('department')->index();
            $table->unsignedInteger('quantity');
            $table->date('date');
            $table->timestamps();

            $table->foreign('ink_id')->references('id')->on('inks')->cascadeOnDelete();
        });

        Schema::create('services', function (Blueprint $table) {
            $table->string('id', 32)->primary();
            $table->string('name');
            $table->timestamps();
        });

        Schema::create('service_providers', function (Blueprint $table) {
            $table->string('id', 32)->primary();
            $table->string('name');
            $table->string('email')->nullable();
            $table->string('phone', 64)->nullable();
            $table->timestamps();
        });

        Schema::create('subscriptions', function (Blueprint $table) {
            $table->string('id', 32)->primary();
            $table->string('service_name');
            $table->string('provider');
            $table->enum('category', ['software', 'cloud', 'security', 'network', 'other'])->index();
            $table->date('start_date');
            $table->date('end_date')->index();
            $table->unsignedInteger('seats')->default(1);
            $table->decimal('annual_cost', 12, 2)->default(0);
            $table->string('department');
            $table->enum('status', ['active', 'expiring', 'expired', 'cancelled'])->default('active');
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('app_users', function (Blueprint $table) {
            $table->string('id', 32)->primary();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('department');
            $table->boolean('active')->default(true);
            $table->json('permissions');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('app_users');
        Schema::dropIfExists('subscriptions');
        Schema::dropIfExists('service_providers');
        Schema::dropIfExists('services');
        Schema::dropIfExists('ink_dispenses');
        Schema::dropIfExists('inks');
        Schema::dropIfExists('ink_colors');
        Schema::dropIfExists('devices');
        Schema::dropIfExists('brands');
        Schema::dropIfExists('device_types');
    }
};
