<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('master_jenis_cutis', function (Blueprint $table) {
            $table->id();
            $table->string('nama_cuti'); // cth: Tahunan, Melahirkan, Menikah
            $table->integer('kuota_default'); // cth: 12, 90, 3
            $table->boolean('potong_cuti_tahunan')->default(false); // Apakah cuti ini mengurangi jatah cuti tahunan?
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('master_jenis_cutis');
    }
};
