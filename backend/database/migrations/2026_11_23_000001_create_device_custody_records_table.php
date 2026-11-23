<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('device_custody_records', function (Blueprint $table) {
            $table->string('id', 32)->primary();
            $table->string('device_id', 32)->index();
            // assigned: تسليم أولي | transferred: نقل بين موظفين/إدارات | returned: إرجاع للمخزن
            $table->enum('action', ['assigned', 'transferred', 'returned']);
            $table->string('from_employee')->nullable();
            $table->string('from_department')->nullable();
            $table->string('to_employee')->nullable();
            $table->string('to_department')->nullable();
            $table->date('date');
            $table->string('condition', 32)->nullable();
            $table->text('notes')->nullable();
            $table->string('performed_by_id', 32)->nullable();
            $table->string('performed_by_name')->nullable();
            $table->timestamps();
        });

        // سجل افتتاحي للأجهزة الموجودة حالياً حتى يبدأ سجل كل جهاز من عهدته الحالية
        $devices = DB::table('devices')->whereNull('deleted_at')->orderBy('id')->get();
        $n = 0;
        foreach ($devices as $device) {
            $n++;
            DB::table('device_custody_records')->insert([
                'id' => sprintf('CUS-%03d', $n),
                'device_id' => $device->id,
                'action' => 'assigned',
                'to_employee' => $device->employee,
                'to_department' => $device->department,
                'date' => substr((string) ($device->created_at ?? now()), 0, 10),
                'notes' => 'قيد افتتاحي: العهدة المسجلة عند تفعيل سجل العهدة.',
                'performed_by_name' => 'النظام',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('device_custody_records');
    }
};
