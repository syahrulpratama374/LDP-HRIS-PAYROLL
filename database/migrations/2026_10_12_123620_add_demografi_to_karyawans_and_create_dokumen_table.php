<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Tambah kolom baru di tabel karyawans
        Schema::table('karyawans', function (Blueprint $table) {
            $table->enum('jenis_kelamin', ['Laki-laki', 'Perempuan'])->after('nama_lengkap')->nullable();
            $table->text('alamat_ktp')->after('status_pernikahan')->nullable();
            $table->text('alamat_domisili')->after('alamat_ktp')->nullable();
            $table->string('nama_kontak_darurat', 150)->after('no_bpjs_ketenagakerjaan')->nullable();
            $table->string('no_telp_darurat', 20)->after('nama_kontak_darurat')->nullable();
        });

        // 2. Buat tabel dokumen_karyawans
        Schema::create('dokumen_karyawans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('karyawan_id')->constrained('karyawans')->onDelete('cascade');
            $table->string('jenis_dokumen', 100); // Ijazah, Sertifikat, dll
            $table->string('nama_dokumen', 255);
            $table->string('file_path', 255);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dokumen_karyawans');
        
        Schema::table('karyawans', function (Blueprint $table) {
            $table->dropColumn([
                'jenis_kelamin', 
                'alamat_ktp', 
                'alamat_domisili', 
                'nama_kontak_darurat', 
                'no_telp_darurat'
            ]);
        });
    }
};