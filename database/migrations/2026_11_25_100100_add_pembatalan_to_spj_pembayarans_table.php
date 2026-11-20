<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Pembatalan pembayaran SPJ bersifat penandaan (tidak menghapus baris & bukti transfer):
 * pembayaran dengan dibatalkan_pada terisi tidak dihitung ke total dibayar, tetapi tetap tampil di riwayat.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('spj_pembayarans', function (Blueprint $table) {
            $table->timestamp('dibatalkan_pada')->nullable()->after('catatan');
            $table->foreignId('dibatalkan_oleh')->nullable()->after('dibatalkan_pada')->constrained('users')->nullOnDelete();
            $table->text('alasan_batal')->nullable()->after('dibatalkan_oleh');
        });
    }

    public function down(): void
    {
        Schema::table('spj_pembayarans', function (Blueprint $table) {
            $table->dropConstrainedForeignId('dibatalkan_oleh');
            $table->dropColumn(['dibatalkan_pada', 'alasan_batal']);
        });
    }
};
