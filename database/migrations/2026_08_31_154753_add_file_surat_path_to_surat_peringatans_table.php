<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Menggunakan Schema::table, bukan Schema::create
        Schema::table('surat_peringatans', function (Blueprint $table) {
            // Tambahkan kolom baru setelah kolom keterangan
            $table->string('file_surat_path', 255)->nullable()->after('keterangan'); 
        });
    }

    public function down(): void
    {
        Schema::table('surat_peringatans', function (Blueprint $table) {
            // Hapus kolom jika migrasi di-rollback
            $table->dropColumn('file_surat_path'); 
        });
    }
};