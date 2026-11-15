<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Tabel tarif efektif rata-rata (TER) PPh 21 sesuai PP 58/2023 (PMK 168/2023)
        Schema::create('master_tarif_ter', function (Blueprint $table) {
            $table->id();
            $table->char('kategori', 1); // A / B / C
            $table->decimal('batas_bawah', 15, 2); // penghasilan bruto bulanan, inklusif
            $table->decimal('batas_atas', 15, 2)->nullable(); // inklusif; null = tak terbatas
            $table->decimal('tarif', 5, 2); // persen
            $table->timestamps();

            $table->index(['kategori', 'batas_bawah']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('master_tarif_ter');
    }
};
