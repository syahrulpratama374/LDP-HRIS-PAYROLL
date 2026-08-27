<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('karyawans', function (Blueprint $table) {
            $table->id();
            
            // Relasi ke tabel akun login (Tambahan Baru)
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            
            // Foreign Keys (Pondasi Master Data)
            $table->foreignId('departemen_id')->constrained('departemens');
            $table->foreignId('jabatan_id')->constrained('jabatans');
            $table->foreignId('golongan_id')->constrained('golongans');
            $table->foreignId('ptkp_id')->constrained('master_ptkps');
            
            // Biodata Dasar
            $table->string('nik_internal', 50)->unique();
            $table->string('nama_lengkap', 150);
            $table->string('tempat_lahir', 100);
            $table->date('tgl_lahir');
            $table->string('agama', 30);
            $table->string('status_pernikahan', 30);
            $table->string('email_kantor', 100)->unique()->nullable();
            $table->string('no_telp', 20)->nullable();
            $table->date('tgl_bergabung');
            
            // Data Sensitif (Keamanan Tinggi)
            $table->text('no_ktp_encrypted');
            $table->text('npwp_encrypted')->nullable();
            $table->text('no_rek_bca_encrypted')->nullable();
            
            // BPJS
            $table->string('no_bpjs_kesehatan', 50)->nullable();
            $table->string('no_bpjs_ketenagakerjaan', 50)->nullable();
            
            // Status & Timestamps
            $table->boolean('status_aktif')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('karyawans');
    }
};