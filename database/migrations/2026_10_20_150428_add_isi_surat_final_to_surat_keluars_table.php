<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('surat_keluars', function (Blueprint $table) {
            $table->longText('isi_surat_final')->nullable()->after('status_approval');
            $table->uuid('uuid')->nullable()->unique()->after('id');
            $table->text('catatan_revisi')->nullable()->after('isi_surat_final');
            $table->text('alasan_batal')->nullable()->after('catatan_revisi');
        });
    }

    public function down(): void
    {
        Schema::table('surat_keluars', function (Blueprint $table) {
            $table->dropColumn([
                'isi_surat_final',
                'uuid',
                'catatan_revisi',
                'alasan_batal',
            ]);
        });
    }
};