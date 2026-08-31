<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('komponen_biaya_spjs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pengajuan_spj_id')->constrained('pengajuan_spjs')->cascadeOnDelete();
            
            // Jenis biaya (misal: 'Tiket Pesawat/Kereta', 'Penginapan', 'Uang Makan', 'Transportasi Lokal', 'Lain-lain')
            $table->string('jenis_biaya', 100); 
            $table->decimal('nominal', 15, 2);
            $table->string('keterangan', 255)->nullable();
            
            // Opsional: Lampiran struk/nota per komponen biaya agar audit lebih tajam
            $table->string('file_nota_path', 255)->nullable(); 
            
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('komponen_biaya_spjs');
    }
};