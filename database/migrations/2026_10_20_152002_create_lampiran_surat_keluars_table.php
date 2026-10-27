<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lampiran_surat_keluars', function (Blueprint $table) {
            $table->id();
            
            // Relasi ke tabel surat_keluars
            $table->foreignId('surat_keluar_id')
                  ->constrained('surat_keluars')
                  ->onDelete('cascade'); // Jika surat dihapus, lampiran otomatis ikut terhapus

            $table->string('nama_file_asli');
            $table->string('file_path');
            $table->string('file_type', 20)->nullable();
            $table->integer('file_size')->nullable(); // Dalam KB
            
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lampiran_surat_keluars');
    }
};