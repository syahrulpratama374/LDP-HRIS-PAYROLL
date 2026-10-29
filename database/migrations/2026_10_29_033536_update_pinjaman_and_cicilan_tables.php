<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pinjaman_karyawans', function (Blueprint $table) {
            $table->enum('jenis_kasbon', ['Finance', 'Divisi'])->default('Finance')->after('karyawan_id');
            $table->foreignId('departemen_id')->nullable()->after('jenis_kasbon')->constrained('departemens')->nullOnDelete();
            $table->text('alasan_pinjaman')->nullable()->after('tenor_bulan');
            $table->timestamp('approved_atasan_at')->nullable()->after('status');
        });

        Schema::table('cicilan_pinjamans', function (Blueprint $table) {
            // Mengubah status_bayar agar mendukung tahap validasi
            $table->enum('status_bayar', ['Belum Lunas', 'Menunggu Validasi', 'Lunas'])->default('Belum Lunas')->change();
            $table->enum('metode_pelunasan', ['Potong Gaji', 'Tunai / Transfer'])->default('Potong Gaji')->after('status_bayar');
            $table->string('bukti_transfer')->nullable()->after('metode_pelunasan');
            $table->timestamp('tgl_bayar')->nullable()->after('bukti_transfer');
        });
    }

    public function down(): void
    {
        Schema::table('pinjaman_karyawans', function (Blueprint $table) {
            $table->dropForeign(['departemen_id']);
            $table->dropColumn(['jenis_kasbon', 'departemen_id', 'alasan_pinjaman', 'approved_atasan_at']);
        });

        Schema::table('cicilan_pinjamans', function (Blueprint $table) {
            $table->enum('status_bayar', ['Belum Lunas', 'Lunas'])->default('Belum Lunas')->change();
            $table->dropColumn(['metode_pelunasan', 'bukti_transfer', 'tgl_bayar']);
        });
    }
};