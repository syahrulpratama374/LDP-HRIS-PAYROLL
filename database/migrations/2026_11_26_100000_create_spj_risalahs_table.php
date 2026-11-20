<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Risalah Perjalanan Dinas (diisi SETELAH perjalanan oleh koordinator atau pengaju):
 * kepala (topik, tempat, waktu), detail per tanggal perjalanan (daftar kegiatan bernomor),
 * dan lampiran gambar rundown/foto per tanggal (disk privat).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('spj_risalahs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('spj_id')->unique()->constrained('spjs')->cascadeOnDelete();
            $table->string('topik', 255)->nullable();
            $table->string('tempat', 255)->nullable();
            $table->string('waktu', 150)->nullable(); // teks bebas, mis. "Sesuai Rundown PD"
            $table->foreignId('diisi_oleh')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('spj_risalah_details', function (Blueprint $table) {
            $table->id();
            $table->foreignId('spj_risalah_id')->constrained('spj_risalahs')->cascadeOnDelete();
            $table->date('tanggal');
            $table->json('kegiatan')->nullable(); // daftar kegiatan (array string), ditampilkan bernomor
            $table->timestamps();

            $table->unique(['spj_risalah_id', 'tanggal']);
        });

        Schema::create('spj_risalah_lampirans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('spj_risalah_detail_id')->constrained('spj_risalah_details')->cascadeOnDelete();
            $table->string('path');
            $table->string('nama_asli', 255)->nullable();
            $table->unsignedInteger('ukuran')->nullable(); // byte
            $table->foreignId('diunggah_oleh')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('spj_risalah_lampirans');
        Schema::dropIfExists('spj_risalah_details');
        Schema::dropIfExists('spj_risalahs');
    }
};
