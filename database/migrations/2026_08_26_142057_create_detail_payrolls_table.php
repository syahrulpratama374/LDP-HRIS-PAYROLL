<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('detail_payrolls', function (Blueprint $table) {
            $table->id();
            $table->foreignId('payroll_id')->constrained('payrolls')->cascadeOnDelete();

            // Relasi ke Master (opsional set null jika master dihapus, agar slip gaji lama tidak hilang)
            $table->foreignId('komponen_id')->nullable()->constrained('master_komponen_payrolls')->nullOnDelete();

            // Snapshot Data Mutlak (Aman dari perubahan Master)
            $table->string('nama_komponen_snapshot', 150); // Cetak: "SPJ Tujuan Jakarta" / "Lembur 2 Jam"
            $table->string('jenis', 20); // 'Pemasukan' atau 'Potongan'
            $table->decimal('nominal', 15, 2);

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('detail_payrolls');
    }
};
