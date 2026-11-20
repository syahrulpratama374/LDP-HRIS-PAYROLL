<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Catatan selisih nota penginapan vs tarif (per malam), dibuat otomatis saat nota penginapan divalidasi.
 * tingkat: 'peringatan' (nota > tarif) atau 'info' (nota < tarif). Provinsi tanpa tarif penginapan tidak dicatat.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('spj_selisih_penginapans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('spj_biaya_id')->unique()->constrained('spj_biayas')->cascadeOnDelete();
            $table->foreignId('spj_id')->constrained('spjs')->cascadeOnDelete();
            $table->string('provinsi', 100);
            $table->string('kategori_tarif', 20);
            $table->unsignedSmallInteger('jumlah_malam');
            $table->decimal('nota_per_malam', 15, 2);
            $table->decimal('tarif_per_malam', 15, 2);
            $table->decimal('selisih_per_malam', 15, 2); // nota - tarif (negatif = lebih murah)
            $table->decimal('persen', 8, 2);            // selisih / tarif x 100
            $table->string('tingkat', 20);              // peringatan|info
            $table->timestamps();

            $table->index(['provinsi', 'tingkat']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('spj_selisih_penginapans');
    }
};
