<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('surat_keluars', function (Blueprint $table) {
            $table->id();
            $table->foreignId('template_id')->constrained('master_template_surats')->onDelete('cascade');
            $table->foreignId('karyawan_id')->constrained('karyawans')->onDelete('cascade'); // Surat ditujukan ke siapa
            
            // Nullable karena mengandalkan Late Assignment (Nomor di akhir)
            $table->string('nomor_surat')->nullable()->unique(); 
            
            $table->enum('status', ['Draft', 'Terbit', 'Batal'])->default('Draft');
            $table->date('tanggal_terbit')->nullable();
            $table->string('file_pdf')->nullable(); // Path penyimpanan file PDF
            
            $table->foreignId('created_by')->constrained('users'); // HC yang membuat
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('surat_keluars');
    }
};