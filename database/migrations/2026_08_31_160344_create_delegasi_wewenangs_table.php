<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('delegasi_wewenangs', function (Blueprint $table) {
            $table->id();
            
            // Atasan yang akan cuti / memberikan wewenang
            $table->foreignId('pemberi_id')->constrained('karyawans')->cascadeOnDelete();
            
            // Atasan pengganti (Plt/Pjs) yang menerima wewenang
            $table->foreignId('penerima_id')->constrained('karyawans')->cascadeOnDelete();
            
            $table->date('tgl_mulai');
            $table->date('tgl_selesai');
            
            $table->text('alasan')->nullable();
            
            // Status: Aktif, Berakhir, atau Dicabut
            $table->string('status', 20)->default('Aktif');
            
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('delegasi_wewenangs');
    }
};