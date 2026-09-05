<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('absensis', function (Blueprint $table) {
            // Menambahkan kolom setelah foto_keluar_path agar urutannya rapi
            $table->enum('status', ['Hadir', 'Terlambat', 'Cuti', 'Dinas Luar', 'Izin', 'Alpha'])
                  ->default('Alpha')
                  ->after('foto_keluar_path');
                  
            $table->string('catatan')
                  ->nullable()
                  ->after('status');
        });
    }

    public function down(): void
    {
        Schema::table('absensis', function (Blueprint $table) {
            // Membatalkan penambahan jika di-rollback
            $table->dropColumn(['status', 'catatan']);
        });
    }
};