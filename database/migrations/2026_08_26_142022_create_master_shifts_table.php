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
        Schema::create('master_shifts', function (Blueprint $table) {
            $table->id();
            $table->string('kode_shift', 20)->unique();
            $table->string('nama_shift', 50);
            $table->time('jam_masuk');
            $table->time('jam_keluar');
            $table->boolean('lintas_hari')->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('master_shifts');
    }
};
