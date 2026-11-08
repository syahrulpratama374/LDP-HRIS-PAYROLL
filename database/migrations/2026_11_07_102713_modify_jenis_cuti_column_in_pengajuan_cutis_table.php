<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('pengajuan_cutis', function (Blueprint $table) {
            // 1. Pengecekan agar tidak error jika dijalankan ulang
            if (Schema::hasColumn('pengajuan_cutis', 'jenis_cuti')) {
                $table->dropColumn('jenis_cuti');
            }
            
            // 2. Tambahkan nullable() agar bersahabat dengan data lama milik tim
            if (!Schema::hasColumn('pengajuan_cutis', 'jenis_cuti_id')) {
                $table->foreignId('jenis_cuti_id')
                      ->nullable() // <--- INI KUNCI SOLUSINYA
                      ->after('karyawan_id')
                      ->constrained('master_jenis_cutis')
                      ->onDelete('restrict');
            }
        });
    }

    public function down()
    {
        Schema::table('pengajuan_cutis', function (Blueprint $table) {
            if (Schema::hasColumn('pengajuan_cutis', 'jenis_cuti_id')) {
                $table->dropForeign(['jenis_cuti_id']);
                $table->dropColumn('jenis_cuti_id');
            }
            
            if (!Schema::hasColumn('pengajuan_cutis', 'jenis_cuti')) {
                $table->string('jenis_cuti', 50)->nullable()->after('karyawan_id');
            }
        });
    }
};