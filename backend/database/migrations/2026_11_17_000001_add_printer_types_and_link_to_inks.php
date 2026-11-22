<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('printer_types', function (Blueprint $table) {
            $table->string('id', 32)->primary();
            $table->string('name');
            $table->string('brand')->nullable();
            $table->timestamps();
        });

        Schema::table('inks', function (Blueprint $table) {
            $table->string('printer_type_id', 32)->nullable()->index()->after('color');
            $table->foreign('printer_type_id')->references('id')->on('printer_types')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('inks', function (Blueprint $table) {
            $table->dropForeign(['printer_type_id']);
            $table->dropColumn('printer_type_id');
        });

        Schema::dropIfExists('printer_types');
    }
};
