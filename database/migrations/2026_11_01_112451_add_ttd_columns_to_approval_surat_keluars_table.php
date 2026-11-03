<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('approval_surat_keluars', function (Blueprint $table) {
            $table->enum('jenis_ttd', ['canvas', 'qr_code'])->nullable()->after('status');
            $table->string('ttd_image_path')->nullable()->after('jenis_ttd');
        });
    }

    public function down(): void
    {
        Schema::table('approval_surat_keluars', function (Blueprint $table) {
            $table->dropColumn(['jenis_ttd', 'ttd_image_path']);
        });
    }
};