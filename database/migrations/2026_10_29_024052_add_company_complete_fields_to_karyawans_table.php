<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('karyawans', function (Blueprint $table) {
            // 1. Pendidikan
            $table->string('pendidikan_terakhir')->nullable()->after('no_bpjs_ketenagakerjaan');
            $table->string('nama_sekolah')->nullable()->after('pendidikan_terakhir');
            $table->string('jurusan')->nullable()->after('nama_sekolah');
            $table->year('tahun_masuk_pendidikan')->nullable()->after('jurusan');
            $table->year('tahun_lulus_pendidikan')->nullable()->after('tahun_masuk_pendidikan');

            // 2. Masa Kerja & Kontrak / PKWT
            $table->date('tgl_mulai_kerja')->nullable()->after('tahun_lulus_pendidikan');
            $table->string('no_sk_tetap')->nullable()->after('tgl_mulai_kerja');
            $table->integer('kontrak_ke')->default(0)->after('no_sk_tetap');
            $table->date('kontrak_1_awal')->nullable()->after('kontrak_ke');
            $table->date('kontrak_1_akhir')->nullable()->after('kontrak_1_awal');
            $table->string('no_pkwt_1')->nullable()->after('kontrak_1_akhir');
            $table->date('kontrak_2_awal')->nullable()->after('no_pkwt_1');
            $table->date('kontrak_2_akhir')->nullable()->after('kontrak_2_awal');
            $table->string('no_pkwt_2')->nullable()->after('kontrak_2_akhir');

            // 3. Performance Appraisal (PA) & Surat Peringatan (SP)
            $table->string('pa_bulan_terakhir')->nullable()->after('no_pkwt_2');
            $table->string('pa_bulan_kembali')->nullable()->after('pa_bulan_terakhir');
            $table->string('pa_nilai')->nullable()->after('pa_bulan_kembali');
            $table->string('sp_jenis')->nullable()->after('pa_nilai'); // SP 1, SP 2, SP 3
            $table->string('sp_masa_berlaku')->nullable()->after('sp_jenis');
            $table->date('sp_dari_tgl')->nullable()->after('sp_masa_berlaku');
            $table->date('sp_sampai_tgl')->nullable()->after('sp_dari_tgl');

            // 4. Status Non-Aktif / Terminated
            $table->string('status_tdk_aktif')->nullable()->after('sp_sampai_tgl');
            $table->date('tgl_non_aktif')->nullable()->after('status_tdk_aktif');
            $table->string('alasan_non_aktif')->nullable()->after('tgl_non_aktif');
        });
    }

    public function down(): void
    {
        Schema::table('karyawans', function (Blueprint $table) {
            $table->dropColumn([
                'pendidikan_terakhir', 'nama_sekolah', 'jurusan', 'tahun_masuk_pendidikan', 'tahun_lulus_pendidikan',
                'tgl_mulai_kerja', 'no_sk_tetap', 'kontrak_ke', 'kontrak_1_awal', 'kontrak_1_akhir', 'no_pkwt_1',
                'kontrak_2_awal', 'kontrak_2_akhir', 'no_pkwt_2', 'pa_bulan_terakhir', 'pa_bulan_kembali',
                'pa_nilai', 'sp_jenis', 'sp_masa_berlaku', 'sp_dari_tgl', 'sp_sampai_tgl',
                'status_tdk_aktif', 'tgl_non_aktif', 'alasan_non_aktif'
            ]);
        });
    }
};