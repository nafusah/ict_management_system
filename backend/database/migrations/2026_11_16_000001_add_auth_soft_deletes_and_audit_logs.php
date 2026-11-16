<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('app_users', function (Blueprint $table) {
            $table->string('password')->nullable()->after('email');
            $table->softDeletes();
        });

        Schema::table('devices', function (Blueprint $table) {
            $table->softDeletes();
        });

        Schema::table('inks', function (Blueprint $table) {
            $table->softDeletes();
        });

        Schema::table('subscriptions', function (Blueprint $table) {
            $table->softDeletes();
        });

        Schema::create('api_tokens', function (Blueprint $table) {
            $table->id();
            $table->string('app_user_id', 32)->index();
            $table->string('token', 64)->unique();
            $table->timestamp('last_used_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();

            $table->foreign('app_user_id')->references('id')->on('app_users')->cascadeOnDelete();
        });

        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->string('user_id', 32)->nullable()->index();
            $table->string('user_name')->nullable();
            $table->string('action', 32)->index();
            $table->string('entity_type', 64)->index();
            $table->string('entity_id', 64)->nullable()->index();
            $table->string('summary');
            $table->json('old_values')->nullable();
            $table->json('new_values')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->timestamp('created_at')->useCurrent()->index();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('api_tokens');

        Schema::table('subscriptions', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });

        Schema::table('inks', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });

        Schema::table('devices', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });

        Schema::table('app_users', function (Blueprint $table) {
            $table->dropSoftDeletes();
            $table->dropColumn('password');
        });
    }
};
