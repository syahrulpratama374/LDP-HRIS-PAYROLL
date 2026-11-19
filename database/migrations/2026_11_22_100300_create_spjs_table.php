<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * SPJ Perjalanan Dinas model baru: satu SPJ untuk banyak peserta, dibayar langsung oleh Finance
 * (TIDAK lewat payroll; PayrollCalculator hanya membaca tabel lama pengajuan_spjs).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('spjs', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->string('nomor_surat')->nullable()->unique(); // terbit di persetujuan terakhir (SPJ-PD)
            $table->foreignId('unit_penerbit_id')->constrained('unit_penerbit_surats')->restrictOnDelete();
            $table->foreignId('dibuat_oleh')->constrained('users')->restrictOnDelete();
            $table->foreignId('koordinator_karyawan_id')->nullable()->constrained('karyawans')->nullOnDelete();

            $table->string('provinsi', 100);
            $table->string('kota', 150);
            $table->date('tgl_berangkat');
            $table->date('tgl_pulang');
            $table->unsignedSmallInteger('jumlah_hari');
            $table->unsignedSmallInteger('jumlah_malam');
            $table->text('keperluan');
            $table->date('tanggal_risalah_awal')->nullable();

            $table->string('status', 20)->default('Draft'); // Draft|Diajukan|Disetujui|Ditolak|Selesai|Dibatalkan
            $table->decimal('total_uang_harian', 15, 2)->default(0);
            $table->timestamp('diajukan_pada')->nullable();
            $table->timestamp('tanggal_terbit')->nullable();
            $table->string('qr_code_token')->nullable();
            $table->text('catatan_revisi')->nullable();
            $table->timestamps();

            $table->index(['status', 'tgl_berangkat', 'tgl_pulang']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('spjs');
    }
};
