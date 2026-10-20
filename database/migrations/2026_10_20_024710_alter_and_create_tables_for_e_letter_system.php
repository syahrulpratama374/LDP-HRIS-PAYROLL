<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Modifikasi tabel master_template_surats
        Schema::table('master_template_surats', function (Blueprint $table) {
            $table->enum('kategori_alur', ['Approval_Direksi', 'Hanya_Notifikasi'])
                  ->default('Approval_Direksi')
                  ->after('konten')
                  ->comment('Menentukan apakah surat butuh TTD pimpinan atau sekadar tembusan');
                  
            $table->string('pembuat_kode', 50)
                  ->nullable()
                  ->after('kategori_alur')
                  ->comment('Contoh: LDP-DIR, LDP-HC, LDP-CORP');
        });

        // 2. Modifikasi tabel surat_keluars
        Schema::table('surat_keluars', function (Blueprint $table) {
            $table->unsignedBigInteger('approver_id')
                  ->nullable()
                  ->after('karyawan_id')
                  ->comment('User ID (Direktur/Atasan) yang harus menyetujui');
                  
            $table->enum('status_approval', ['Draft', 'Menunggu_Approval', 'Disetujui', 'Ditolak'])
                  ->default('Draft')
                  ->after('status');
                  
            $table->enum('jenis_ttd', ['Digital_Canvas', 'Qr_Code_Quick', 'Tanpa_TTD'])
                  ->nullable()
                  ->after('status_approval');
                  
            $table->string('file_ttd_path')
                  ->nullable()
                  ->after('jenis_ttd');
                  
            $table->string('qr_code_token')
                  ->unique()
                  ->nullable()
                  ->after('file_ttd_path')
                  ->comment('Token unik untuk validasi QR Code publik');
        });

        // 3. Buat tabel baru untuk jejak audit (Audit Trail Approval)
        Schema::create('riwayat_surat_approvals', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('surat_keluar_id');
            $table->unsignedBigInteger('user_id')->comment('User yang melakukan aksi');
            $table->string('aksi', 50)->comment('Contoh: Diajukan, Disetujui, Ditolak');
            $table->text('catatan')->nullable()->comment('Alasan jika ditolak');
            $table->timestamps();

            // Foreign keys
            $table->foreign('surat_keluar_id')->references('id')->on('surat_keluars')->onDelete('cascade');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('riwayat_surat_approvals');

        Schema::table('surat_keluars', function (Blueprint $table) {
            $table->dropColumn(['approver_id', 'status_approval', 'jenis_ttd', 'file_ttd_path', 'qr_code_token']);
        });

        Schema::table('master_template_surats', function (Blueprint $table) {
            $table->dropColumn(['kategori_alur', 'pembuat_kode']);
        });
    }
};