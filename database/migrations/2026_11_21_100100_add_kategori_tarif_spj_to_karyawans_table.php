<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('karyawans', function (Blueprint $table) {
            // Kategori tarif SPJ (Staff | Manager | Direksi), diisi HC per orang.
            // Perhitungan SPJ SELALU membaca kolom ini, bukan jenjang jabatan.
            $table->string('kategori_tarif_spj', 20)->default('Staff')->after('jabatan_id');
        });
    }

    public function down(): void
    {
        Schema::table('karyawans', function (Blueprint $table) {
            $table->dropColumn('kategori_tarif_spj');
        });
    }
};
