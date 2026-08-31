<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('penilaian_kinerjas', function (Blueprint $table) {
            $table->id();
            // Karyawan yang dievaluasi
            $table->foreignId('karyawan_id')->constrained('karyawans')->cascadeOnDelete();

            // Supervisor / Manager yang memberikan nilai
            $table->foreignId('penilai_id')->nullable()->constrained('karyawans')->nullOnDelete();

            $table->integer('periode_bulan');
            $table->integer('periode_tahun');

            // Skor KPI (0 - 100)
            $table->decimal('skor_kpi', 5, 2);
            $table->text('catatan_evaluasi')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('penilaian_kinerjas');
    }
};
