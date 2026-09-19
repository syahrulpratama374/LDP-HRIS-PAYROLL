<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('departemens', function (Blueprint $table) {
            // Tambahkan kolom boolean baru, default-nya false (tidak wajib logbook)
            $table->boolean('is_wajib_logbook')->default(false)->after('nama_departemen');
        });
    }

    public function down(): void
    {
        Schema::table('departemens', function (Blueprint $table) {
            $table->dropColumn('is_wajib_logbook');
        });
    }
};