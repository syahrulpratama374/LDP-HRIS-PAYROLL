<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Master tarif SPJ per provinsi x jenis x kategori, dikelola HC. Satuan OH (orang/hari).
        // Tarif yang dipakai = baris dengan berlaku_mulai terakhir <= tanggal berangkat.
        Schema::create('master_tarif_spjs', function (Blueprint $table) {
            $table->id();
            $table->string('provinsi', 100);
            $table->string('jenis', 20);     // uang_harian | penginapan
            $table->string('kategori', 20);  // Staff | Manager | Direksi
            $table->decimal('nominal', 15, 2);
            $table->string('satuan', 10)->default('OH');
            $table->date('berlaku_mulai');
            $table->timestamps();

            $table->unique(['provinsi', 'jenis', 'kategori', 'berlaku_mulai'], 'tarif_spj_unik');
            $table->index(['jenis', 'kategori']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('master_tarif_spjs');
    }
};
