<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Peserta SPJ + snapshot perhitungan. Snapshot diperbarui setiap draf disimpan dan dibekukan saat
 * diajukan, sehingga perubahan tarif/kategori/rekening sesudahnya tidak mengubah SPJ berjalan.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('spj_pesertas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('spj_id')->constrained('spjs')->cascadeOnDelete();
            $table->foreignId('karyawan_id')->constrained('karyawans')->restrictOnDelete();
            $table->unsignedSmallInteger('urutan')->default(0);

            $table->string('nama', 150);
            $table->string('posisi', 150)->nullable();
            $table->string('departemen', 100)->nullable();
            $table->string('kategori_tarif', 20);
            $table->decimal('tarif_uang_harian', 15, 2)->nullable();   // null = provinsi belum punya tarif
            $table->decimal('total_uang_harian', 15, 2)->default(0);
            $table->decimal('tarif_penginapan', 15, 2)->nullable();
            $table->decimal('batas_penginapan', 15, 2)->nullable();    // tarif penginapan x malam
            $table->text('rekening_encrypted')->nullable();
            $table->timestamps();

            $table->unique(['spj_id', 'karyawan_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('spj_pesertas');
    }
};
