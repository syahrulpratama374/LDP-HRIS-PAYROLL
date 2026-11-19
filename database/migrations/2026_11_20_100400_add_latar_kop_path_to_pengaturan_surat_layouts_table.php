<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pengaturan_surat_layouts', function (Blueprint $table) {
            // Gambar latar A4 penuh (kop + watermark + footer + logo ISO + banner dalam satu gambar).
            // Bila terisi, PDF memakai gambar ini dan tidak merender kop/footer/watermark buatan CSS.
            $table->string('latar_kop_path')->nullable()->after('banner_footer_path');
        });
    }

    public function down(): void
    {
        Schema::table('pengaturan_surat_layouts', function (Blueprint $table) {
            $table->dropColumn('latar_kop_path');
        });
    }
};
