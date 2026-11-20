<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Pembayaran SPJ per peserta yang dicatat Finance (di luar payroll): uang harian dan reimburse,
 * dengan bukti transfer di storage privat. Rekening tujuan disimpan sebagai snapshot terenkripsi.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('spj_pembayarans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('spj_peserta_id')->constrained('spj_pesertas')->restrictOnDelete();
            $table->string('jenis', 20); // uang_harian|reimburse
            $table->decimal('nominal', 15, 2);
            $table->date('tanggal_transfer');
            $table->string('bukti_transfer_path');
            $table->text('rekening_encrypted')->nullable(); // snapshot rekening tujuan saat dicatat
            $table->foreignId('dicatat_oleh')->constrained('users')->restrictOnDelete();
            $table->text('catatan')->nullable();
            $table->timestamps();

            $table->index(['spj_peserta_id', 'jenis']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('spj_pembayarans');
    }
};
