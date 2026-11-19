<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Master unit "Yang Mengeluarkan" surat (segmen ke-3 nomor surat, mis. LDP-HC).
        // Isi lewat UnitPenerbitSuratSeeder; belum ada halaman CRUD.
        Schema::create('unit_penerbit_surats', function (Blueprint $table) {
            $table->id();
            $table->string('kode', 30)->unique();
            $table->string('nama');
            // Unik: satu departemen paling banyak punya satu unit default
            $table->foreignId('departemen_id')->nullable()->unique()
                ->constrained('departemens')->nullOnDelete();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('unit_penerbit_surats');
    }
};
