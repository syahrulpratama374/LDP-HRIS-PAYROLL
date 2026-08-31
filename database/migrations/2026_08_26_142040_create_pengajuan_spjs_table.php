<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pengajuan_spjs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('karyawan_id')->constrained('karyawans')->cascadeOnDelete();
            
            // Detail Perjalanan
            $table->string('tujuan', 150);
            $table->text('keperluan');
            $table->date('tgl_mulai');
            $table->date('tgl_selesai');
            
            // Finansial & Bukti
            $table->decimal('total_biaya', 15, 2)->default(0);
            $table->string('file_bukti_path', 255)->nullable();
            
            // Status Approval & Payroll
            $table->string('status_approval', 30)->default('Pending');
            $table->boolean('sudah_dibayar')->default(false); // Penanda jika dana sudah masuk ke Payroll
            
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pengajuan_spjs');
    }
};