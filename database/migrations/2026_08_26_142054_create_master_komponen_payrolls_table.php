<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('master_komponen_payrolls', function (Blueprint $table) {
            $table->id();
            $table->string('kode_komponen', 50)->unique(); // Contoh: GP (Gaji Pokok), SPJ, LBR, KASBON
            $table->string('nama_komponen', 100);
            $table->string('jenis', 20); // 'Pemasukan' atau 'Potongan'
            $table->boolean('is_taxable')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('master_komponen_payrolls');
    }
};
