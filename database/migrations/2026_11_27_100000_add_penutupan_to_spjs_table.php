<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Penutupan SPJ: status Selesai (Finance, setelah semua syarat terpenuhi) dan Dibatalkan
 * (pengaju sebelum disetujui; HC setelah disetujui dengan alasan, bila belum ada pembayaran aktif).
 * Nomor surat SPJ yang dibatalkan tetap tercatat di nomor_surat_terbits dan tidak dipakai ulang.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('spjs', function (Blueprint $table) {
            $table->timestamp('diselesaikan_pada')->nullable()->after('catatan_revisi');
            $table->foreignId('diselesaikan_oleh')->nullable()->after('diselesaikan_pada')->constrained('users')->nullOnDelete();
            $table->timestamp('dibatalkan_pada')->nullable()->after('diselesaikan_oleh');
            $table->foreignId('dibatalkan_oleh')->nullable()->after('dibatalkan_pada')->constrained('users')->nullOnDelete();
            $table->text('alasan_batal')->nullable()->after('dibatalkan_oleh');
        });
    }

    public function down(): void
    {
        Schema::table('spjs', function (Blueprint $table) {
            $table->dropConstrainedForeignId('diselesaikan_oleh');
            $table->dropConstrainedForeignId('dibatalkan_oleh');
            $table->dropColumn(['diselesaikan_pada', 'dibatalkan_pada', 'alasan_batal']);
        });
    }
};
