<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('karyawans', function (Blueprint $table) {
            // Judul posisi sesuai bagan (mis. "Head of Artistic - Creative Team"); jenjang tetap di jabatan_id.
            // Dipakai dokumen (PDF SPJ); bila kosong, dokumen memakai nama jenjang jabatan.
            $table->string('nama_posisi', 150)->nullable()->after('jabatan_id');
        });
    }

    public function down(): void
    {
        Schema::table('karyawans', function (Blueprint $table) {
            $table->dropColumn('nama_posisi');
        });
    }
};
