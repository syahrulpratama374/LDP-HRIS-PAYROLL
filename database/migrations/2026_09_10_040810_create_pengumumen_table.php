<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pengumumans', function (Blueprint $table) {
            $table->id();
            $table->string('judul');
            $table->text('konten');
            $table->foreignId('pembuat_id')->constrained('users')->onDelete('cascade');
            
            // Opsi: "Global" atau ID Departemen tertentu
            $table->string('target_audiens')->default('Global'); 
            
            $table->date('tgl_mulai');
            $table->date('tgl_selesai');
            
            // Opsi: "Info", "Peringatan", "Sukses" (Akan mempengaruhi warna banner)
            $table->string('tipe_banner')->default('Info'); 
            $table->boolean('is_aktif')->default(true);
            
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pengumumans');
    }
};