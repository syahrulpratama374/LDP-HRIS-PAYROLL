<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('asets', function (Blueprint $table) {
            $table->id();
            $table->string('kode_aset')->unique(); 
            $table->string('nama_aset'); 
            $table->string('kategori'); // Contoh: Elektronik, Kendaraan, Furniture
            $table->date('tgl_beli')->nullable();
            $table->decimal('harga_beli', 15, 2)->nullable();
            
            // Expiry Tracker (Untuk STNK, Pajak, Lisensi Software)
            $table->date('tgl_expired_pajak')->nullable(); 
            
            // Relasi ke siapa karyawan yang memegang barang ini
            $table->foreignId('penanggung_jawab_id')->nullable()->constrained('karyawans')->nullOnDelete(); 
            
            $table->enum('status', ['Tersedia', 'Dipakai', 'Rusak', 'Maintenance'])->default('Tersedia');
            $table->string('qr_code_path')->nullable(); 
            
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('asets');
    }
};