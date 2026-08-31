<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('surat_peringatans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('karyawan_id')->constrained('karyawans')->cascadeOnDelete();
            
            $table->string('jenis_sp', 50); // Contoh: SP 1, SP 2, SP 3
            $table->date('tgl_mulai');
            $table->date('tgl_selesai');
            $table->text('keterangan')->nullable();
            
            // Opsional: Untuk menyimpan file scan PDF yang sudah ditandatangani
            $table->string('file_surat_path', 255)->nullable(); 
            
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('surat_peringatans');
    }
};