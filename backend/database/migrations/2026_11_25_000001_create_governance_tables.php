<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * قسم "التخطيط والحوكمة التقنية":
 * - strategic_objectives: الأهداف الاستراتيجية ومؤشرات أدائها (KPIs كـ JSON في النسخة المبدئية)
 * - it_projects: المشاريع التقنية ومراحلها ومخاطرها (JSON في النسخة المبدئية)
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('strategic_objectives', function (Blueprint $table) {
            $table->string('id', 32)->primary();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('pillar', 120)->nullable();
            $table->unsignedSmallInteger('start_year');
            $table->unsignedSmallInteger('end_year');
            $table->string('owner')->nullable();
            $table->string('status', 20)->default('active');
            $table->json('kpis')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('it_projects', function (Blueprint $table) {
            $table->string('id', 32)->primary();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('objective_id', 32)->nullable()->index();
            $table->string('manager')->nullable();
            $table->string('department')->nullable();
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->decimal('budget', 14, 2)->nullable();
            $table->string('priority', 20)->default('medium');
            $table->string('status', 20)->default('planned');
            $table->unsignedTinyInteger('progress')->default(0);
            $table->json('milestones')->nullable();
            $table->json('risks')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('it_projects');
        Schema::dropIfExists('strategic_objectives');
    }
};
