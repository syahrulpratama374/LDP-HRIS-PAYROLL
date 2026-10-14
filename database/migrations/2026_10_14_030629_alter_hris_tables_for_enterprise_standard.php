<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Alter Tabel Keluarga
        Schema::table('keluarga_karyawans', function (Blueprint $table) {
            $table->text('nik_keluarga_encrypted')->nullable()->after('jenis_relasi');
            $table->date('tgl_lahir')->nullable()->after('nama_anggota');
            $table->enum('jenis_kelamin', ['Laki-laki', 'Perempuan'])->nullable()->after('tgl_lahir');
            $table->boolean('status_tanggungan_bpjs')->default(false)->after('jenis_kelamin');
        });

        // 2. Alter Tabel Pendidikan
        Schema::table('pendidikan_karyawans', function (Blueprint $table) {
            $table->string('jenjang', 50)->nullable()->after('karyawan_id'); // Cth: SD, SMP, SMA/SMK, D3, S1, S2
        });

        // 3. Alter Tabel Riwayat Kontrak
        Schema::table('riwayat_kontraks', function (Blueprint $table) {
            $table->string('file_kontrak_path', 255)->nullable()->after('tgl_akhir');
            $table->text('keterangan')->nullable()->after('file_kontrak_path');
        });
    }

    public function down(): void
    {
        Schema::table('keluarga_karyawans', function (Blueprint $table) {
            $table->dropColumn(['nik_keluarga_encrypted', 'tgl_lahir', 'jenis_kelamin', 'status_tanggungan_bpjs']);
        });

        Schema::table('pendidikan_karyawans', function (Blueprint $table) {
            $table->dropColumn('jenjang');
        });

        Schema::table('riwayat_kontraks', function (Blueprint $table) {
            $table->dropColumn(['file_kontrak_path', 'keterangan']);
        });
    }
};