<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Nota reimburse SPJ per peserta (penginapan/tiket/transport/lainnya). Diunggah setelah SPJ Disetujui,
 * divalidasi Finance. Penginapan dibayar min(nota, sisa batas penginapan peserta); jenis lain sesuai nota.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('spj_biayas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('spj_peserta_id')->constrained('spj_pesertas')->cascadeOnDelete();
            $table->string('jenis', 20); // penginapan|tiket|transport|lainnya
            $table->date('tanggal');
            $table->string('keterangan', 255)->nullable();
            $table->unsignedSmallInteger('jumlah_malam')->nullable(); // wajib untuk penginapan (nota per malam)
            $table->decimal('nominal_nota', 15, 2);
            $table->string('file_nota_path');
            $table->string('status', 20)->default('Menunggu'); // Menunggu|Divalidasi|Ditolak
            $table->decimal('nominal_dibayar', 15, 2)->nullable();
            $table->foreignId('diunggah_oleh')->constrained('users')->restrictOnDelete();
            $table->foreignId('divalidasi_oleh')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('divalidasi_pada')->nullable();
            $table->text('catatan')->nullable();
            $table->timestamps();

            $table->index(['spj_peserta_id', 'jenis', 'status']);
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('spj_biayas');
    }
};
