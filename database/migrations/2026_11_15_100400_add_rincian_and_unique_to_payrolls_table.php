<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payrolls', function (Blueprint $table) {
            $table->decimal('bruto_pajak', 15, 2)->default(0)->after('total_gaji_bersih');
            $table->decimal('iuran_pensiun', 15, 2)->default(0)->after('bruto_pajak'); // JHT + JP porsi karyawan
            $table->decimal('pph21', 15, 2)->default(0)->after('iuran_pensiun');
            $table->decimal('bpjs_perusahaan', 15, 2)->default(0)->after('pph21'); // informasi saja
            $table->string('peringatan', 255)->nullable()->after('bpjs_perusahaan');
            $table->json('rincian_pajak')->nullable()->after('peringatan');

            $table->unique(['karyawan_id', 'periode_bulan', 'periode_tahun'], 'payrolls_karyawan_periode_unique');
        });

        // Penautan SPJ ke payroll Draft (efek samping baru dijalankan saat finalize)
        Schema::table('pengajuan_spjs', function (Blueprint $table) {
            $table->unsignedBigInteger('payroll_id')->nullable()->after('sudah_dibayar');
            $table->index('payroll_id');
        });
    }

    public function down(): void
    {
        Schema::table('pengajuan_spjs', function (Blueprint $table) {
            $table->dropIndex(['payroll_id']);
            $table->dropColumn('payroll_id');
        });

        Schema::table('payrolls', function (Blueprint $table) {
            $table->dropUnique('payrolls_karyawan_periode_unique');
            $table->dropColumn(['bruto_pajak', 'iuran_pensiun', 'pph21', 'bpjs_perusahaan', 'peringatan', 'rincian_pajak']);
        });
    }
};
