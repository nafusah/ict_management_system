<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ink_vouchers', function (Blueprint $table) {
            $table->string('scope', 20)->default('shared')->after('department');
            $table->string('recipient_name')->nullable()->after('scope');
        });

        Schema::table('ink_dispenses', function (Blueprint $table) {
            $table->string('scope', 20)->default('shared')->after('department');
            $table->string('recipient_name')->nullable()->after('scope');
        });
    }

    public function down(): void
    {
        Schema::table('ink_vouchers', function (Blueprint $table) {
            $table->dropColumn(['scope', 'recipient_name']);
        });

        Schema::table('ink_dispenses', function (Blueprint $table) {
            $table->dropColumn(['scope', 'recipient_name']);
        });
    }
};
