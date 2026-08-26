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
        Schema::create('komponen_biaya_spjs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('spj_id')->constrained('pengajuan_spjs')->cascadeOnDelete();
            $table->string('jenis_biaya', 50)->nullable();
            $table->decimal('nominal', 15, 2);
            $table->string('bukti_path', 255)->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('komponen_biaya_spjs');
    }
};
