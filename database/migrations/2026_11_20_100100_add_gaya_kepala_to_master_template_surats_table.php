<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('master_template_surats', function (Blueprint $table) {
            // judul_tengah: judul bergaris bawah + "Nomor : ..." di tengah (gaya A)
            // blok_nomor : blok Nomor / Lampiran / Hal (gaya B)
            $table->string('gaya_kepala', 20)->default('blok_nomor')->after('kategori_alur');
        });
    }

    public function down(): void
    {
        Schema::table('master_template_surats', function (Blueprint $table) {
            $table->dropColumn('gaya_kepala');
        });
    }
};
