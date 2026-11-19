<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Penghitung nomor urut per kunci urutan (mis. "2026", "2026|SKET", "2026|LDP-HC").
        // Baris dikunci SELECT ... FOR UPDATE saat penerbitan agar nomor tidak ganda.
        Schema::create('penomoran_surats', function (Blueprint $table) {
            $table->id();
            $table->string('kunci', 100)->unique();
            $table->unsignedInteger('nomor_terakhir')->default(0);
            $table->timestamps();
        });

        // Register semua nomor yang pernah terbit, lintas modul (Surat Keluar, SPJ, dst.).
        // nomor unik => nomor yang sudah terbit tidak pernah dipakai ulang.
        Schema::create('nomor_surat_terbits', function (Blueprint $table) {
            $table->id();
            $table->string('nomor')->unique();
            $table->unsignedSmallInteger('tahun');
            $table->unsignedInteger('urut');
            $table->string('kode_jenis', 50);
            $table->string('kode_penerbit', 30);
            $table->nullableMorphs('sumber');
            $table->timestamp('diterbitkan_pada')->nullable();
            $table->timestamps();

            $table->index(['tahun', 'kode_jenis']);
            $table->index(['tahun', 'kode_penerbit']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('nomor_surat_terbits');
        Schema::dropIfExists('penomoran_surats');
    }
};
