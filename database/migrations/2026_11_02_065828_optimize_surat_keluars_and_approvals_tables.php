<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Hapus kolom legacy dari tabel surat_keluars jika masih ada
        Schema::table('surat_keluars', function (Blueprint $table) {
            if (Schema::hasColumn('surat_keluars', 'approver_id')) {
                $table->dropColumn('approver_id');
            }
            if (Schema::hasColumn('surat_keluars', 'jenis_ttd')) {
                $table->dropColumn('jenis_ttd');
            }
            if (Schema::hasColumn('surat_keluars', 'file_ttd_path')) {
                $table->dropColumn('file_ttd_path');
            }
        });

        // 2. Tambahkan kolom TTD ke tabel approval_surat_keluars jika belum ada
        Schema::table('approval_surat_keluars', function (Blueprint $table) {
            if (!Schema::hasColumn('approval_surat_keluars', 'jenis_ttd')) {
                $table->string('jenis_ttd', 20)->nullable()->after('catatan');
            }
            if (!Schema::hasColumn('approval_surat_keluars', 'ttd_image_path')) {
                $table->string('ttd_image_path', 255)->nullable()->after('jenis_ttd');
            }
        });
    }

    public function down(): void
    {
        Schema::table('surat_keluars', function (Blueprint $table) {
            if (!Schema::hasColumn('surat_keluars', 'approver_id')) {
                $table->unsignedBigInteger('approver_id')->nullable();
            }
            if (!Schema::hasColumn('surat_keluars', 'jenis_ttd')) {
                $table->string('jenis_ttd', 20)->nullable();
            }
            if (!Schema::hasColumn('surat_keluars', 'file_ttd_path')) {
                $table->string('file_ttd_path', 255)->nullable();
            }
        });

        Schema::table('approval_surat_keluars', function (Blueprint $table) {
            if (Schema::hasColumn('approval_surat_keluars', 'ttd_image_path')) {
                $table->dropColumn('ttd_image_path');
            }
            if (Schema::hasColumn('approval_surat_keluars', 'jenis_ttd')) {
                $table->dropColumn('jenis_ttd');
            }
        });
    }
};