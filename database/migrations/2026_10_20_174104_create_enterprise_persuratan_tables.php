<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. TABEL PENGATURAN KOP & ASET VISUAL TAHUNAN
        Schema::create('pengaturan_surat_layouts', function (Blueprint $table) {
            $table->id();
            $table->string('tahun_periode', 4); // Contoh: 2026
            
            // Teks Identitas
            $table->string('nama_perusahaan')->default('PT. Lintas Data Prima');
            $table->string('slogan')->nullable();
            $table->text('alamat')->nullable();
            $table->string('telepon')->nullable();
            $table->string('email')->nullable();
            $table->string('website')->nullable();
            
            // Path Aset Visual
            $table->string('logo_header_path')->nullable();
            $table->string('watermark_path')->nullable();
            $table->json('logo_iso_paths')->nullable(); // Bisa banyak logo ISO
            $table->string('banner_footer_path')->nullable();
            
            $table->boolean('is_active')->default(false); // Penanda layout yang sedang dipakai
            $table->timestamps();
        });

        // 2. TABEL CETAK BIRU RUTE APPROVAL (Milik Template)
        Schema::create('rute_approval_templates', function (Blueprint $table) {
            $table->id();
            // Relasi ke Master Template Surat
            $table->foreignId('template_id')->constrained('master_template_surats')->onDelete('cascade');
            
            $table->integer('urutan_langkah'); // 1, 2, 3, dst.
            
            // Relasi ke Jabatan (Bukan user spesifik, agar kebal jika ada mutasi)
            $table->foreignId('jabatan_id')->constrained('jabatans')->onDelete('cascade');
            
            $table->string('label_ttd'); // Contoh: "Diajukan Oleh", "Diperiksa Oleh"
            $table->timestamps();
        });

        // 3. TABEL TRANSAKSI APPROVAL AKTUAL (Milik Surat Keluar)
        Schema::create('approval_surat_keluars', function (Blueprint $table) {
            $table->id();
            // Relasi ke Draf Surat yang diajukan
            $table->foreignId('surat_keluar_id')->constrained('surat_keluars')->onDelete('cascade');
            
            $table->integer('urutan_langkah');
            $table->foreignId('jabatan_id')->constrained('jabatans'); // Jabatan yang dituju
            
            // User aktual yang benar-benar menekan tombol TTD (untuk audit log)
            $table->foreignId('user_id_aktual')->nullable()->constrained('users');
            
            $table->string('label_ttd'); 
            $table->enum('status', ['Menunggu', 'Disetujui', 'Ditolak'])->default('Menunggu');
            $table->timestamp('waktu_approval')->nullable();
            $table->text('catatan')->nullable(); // Alasan jika ditolak oleh pimpinan
            
            $table->timestamps();
        });
    }

    public function down(): void
    {
        // Drop tabel harus dengan urutan terbalik agar tidak bentrok foreign key
        Schema::dropIfExists('approval_surat_keluars');
        Schema::dropIfExists('rute_approval_templates');
        Schema::dropIfExists('pengaturan_surat_layouts');
    }
};
