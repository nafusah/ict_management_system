<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('subscription_categories', function (Blueprint $table) {
            $table->string('id', 32)->primary();
            $table->string('name');
            $table->string('icon', 32)->default('layers');
            $table->timestamps();
        });

        $now = now();
        foreach ([
            ['id' => 'software', 'name' => 'برمجيات وتطبيقات', 'icon' => 'monitor'],
            ['id' => 'cloud', 'name' => 'خدمات سحابية', 'icon' => 'cloud'],
            ['id' => 'security', 'name' => 'أمن سيبراني وحماية', 'icon' => 'security'],
            ['id' => 'network', 'name' => 'شبكات واتصالات', 'icon' => 'network'],
            ['id' => 'other', 'name' => 'أخرى', 'icon' => 'layers'],
        ] as $row) {
            DB::table('subscription_categories')->updateOrInsert(
                ['id' => $row['id']],
                [
                    'name' => $row['name'],
                    'icon' => $row['icon'],
                    'created_at' => $now,
                    'updated_at' => $now,
                ],
            );
        }

        Schema::table('subscriptions', function (Blueprint $table) {
            $table->string('category', 64)->change();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('subscription_categories');
    }
};
