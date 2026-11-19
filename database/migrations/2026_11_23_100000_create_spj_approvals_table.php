<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Langkah persetujuan per SPJ, disalin dari rute template SPJ-PD saat SPJ diajukan
 * (HC -> Finance -> Direktur). Penyetuju ditunjuk lewat role atau jabatan.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('spj_approvals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('spj_id')->constrained('spjs')->cascadeOnDelete();
            $table->unsignedSmallInteger('urutan_langkah');
            $table->string('tipe_penyetuju', 10); // role | jabatan
            $table->foreignId('role_id')->nullable()->constrained('roles')->restrictOnDelete();
            $table->foreignId('jabatan_id')->nullable()->constrained('jabatans')->restrictOnDelete();
            $table->string('label_ttd');
            $table->string('status', 15)->default('Menunggu'); // Menunggu | Disetujui | Ditolak

            $table->foreignId('user_id_aktual')->nullable()->constrained('users')->nullOnDelete();
            // Bila disetujui lewat Delegasi Wewenang: karyawan pemberi wewenang (atas nama)
            $table->foreignId('atas_nama_karyawan_id')->nullable()->constrained('karyawans')->nullOnDelete();
            $table->timestamp('waktu_approval')->nullable();
            $table->text('catatan')->nullable();
            $table->string('jenis_ttd', 20)->nullable();
            $table->string('ttd_image_path')->nullable();
            $table->timestamps();

            $table->unique(['spj_id', 'urutan_langkah']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('spj_approvals');
    }
};
