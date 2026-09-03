<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('master_template_surats', function (Blueprint $table) {
            $table->id();
            $table->string('nama_template'); // Cth: Surat Keterangan Kerja
            $table->string('kode_surat'); // Cth: SKK (Untuk format penomoran)
            $table->longText('konten'); // Berisi HTML dengan placeholder [NAMA], [NIK], dll
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('master_template_surats');
    }
};