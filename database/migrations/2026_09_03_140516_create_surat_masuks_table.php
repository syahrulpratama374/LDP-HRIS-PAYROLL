<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('surat_masuks', function (Blueprint $table) {
            $table->id();
            $table->string('nomor_surat_asal'); // Nomor dari instansi pengirim
            $table->string('instansi_pengirim');
            $table->string('perihal');
            $table->date('tanggal_terima');
            $table->string('file_pdf'); // Path file scan surat
            $table->foreignId('diterima_oleh')->constrained('users'); // HC yang menginput
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('surat_masuks');
    }
};