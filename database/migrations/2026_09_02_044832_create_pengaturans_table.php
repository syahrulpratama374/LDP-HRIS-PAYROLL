<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pengaturans', function (Blueprint $table) {
            $table->id();
            
            // Kolom 'kunci' untuk memanggil pengaturan (contoh: 'radius_absensi', 'batas_approval_finance')
            $table->string('kunci')->unique();
            
            // Kolom 'nilai' untuk menyimpan datanya (contoh: '50', '5000000')
            $table->text('nilai')->nullable();
            
            // Penjelasan singkat agar Admin paham fungsi pengaturan ini
            $table->string('keterangan')->nullable();
            
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pengaturans');
    }
};