<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pengajuan_cutis', function (Blueprint $table) {
            $table->id();
            $table->foreignId('karyawan_id')->constrained('karyawans')->cascadeOnDelete();
            
            // Kolom yang disesuaikan dengan form React
            $table->string('jenis_cuti', 50);
            $table->date('tanggal_mulai'); 
            $table->date('tanggal_selesai');
            $table->text('alasan');
            $table->string('dokumen_bukti_path', 255)->nullable();
            $table->string('status_approval', 30)->default('Pending');
            
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pengajuan_cutis');
    }
};