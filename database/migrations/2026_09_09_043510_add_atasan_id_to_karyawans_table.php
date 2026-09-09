<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('karyawans', function (Blueprint $table) {
            // Menambahkan kolom atasan_id yang merujuk ke id di tabel yang sama
            $table->foreignId('atasan_id')->nullable()->constrained('karyawans')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('karyawans', function (Blueprint $table) {
            $table->dropForeign(['atasan_id']);
            $table->dropColumn('atasan_id');
        });
    }
};