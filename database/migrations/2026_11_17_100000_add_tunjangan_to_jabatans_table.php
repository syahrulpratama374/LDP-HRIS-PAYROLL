<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('jabatans', function (Blueprint $table) {
            // Tunjangan jabatan tetap per bulan; dibaca PayrollCalculator sebagai baris "Tunjangan Jabatan"
            $table->decimal('tunjangan', 15, 2)->default(0)->after('nama_jabatan');
        });
    }

    public function down(): void
    {
        Schema::table('jabatans', function (Blueprint $table) {
            $table->dropColumn('tunjangan');
        });
    }
};
