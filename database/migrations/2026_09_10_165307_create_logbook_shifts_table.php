<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('logbook_shifts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('karyawan_id')->constrained('karyawans')->cascadeOnDelete();
            $table->foreignId('shift_id')->constrained('master_shifts')->cascadeOnDelete();
            $table->date('tanggal');
            $table->text('catatan_handover'); // Ringkasan kendala/tugas yang dioper
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('logbook_shifts');
    }
};