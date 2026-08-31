<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payrolls', function (Blueprint $table) {
            $table->id();
            $table->foreignId('karyawan_id')->constrained('karyawans')->cascadeOnDelete();

            // Periode Gaji
            $table->integer('periode_bulan');
            $table->integer('periode_tahun');

            // Snapshot Rekapitulasi Utama (Immutability)
            $table->decimal('gaji_pokok_saat_itu', 15, 2)->default(0);
            $table->decimal('total_pemasukan', 15, 2)->default(0); // Total tunjangan + lembur + SPJ
            $table->decimal('total_potongan', 15, 2)->default(0); // Total pajak + BPJS + kasbon
            $table->decimal('total_gaji_bersih', 15, 2)->default(0); // Take Home Pay

            // Status Siklus: Draft -> Disetujui -> Dibayar
            $table->string('status', 30)->default('Draft');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payrolls');
    }
};
