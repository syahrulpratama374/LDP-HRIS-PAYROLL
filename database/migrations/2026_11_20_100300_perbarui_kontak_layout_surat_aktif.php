<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Data: kontak resmi perusahaan pada layout surat yang aktif (tampil di footer PDF).
 * Bisa dibalik: down() mengembalikan nilai lama yang dicatat di sini.
 */
return new class extends Migration
{
    private const BARU = [
        'alamat' => 'Darmo Residence No. 1, Kasihan, Bantul - Yogyakarta',
        'telepon' => '(0274) 415632',
        'email' => 'sales@ldp.net.id',
        'website' => 'www.ldp.net.id',
    ];

    private const LAMA_ALAMAT = 'Jl. Sakti No. 12, Yogyakarta';

    public function up(): void
    {
        DB::table('pengaturan_surat_layouts')->where('is_active', true)
            ->update(self::BARU + ['updated_at' => now()]);
    }

    public function down(): void
    {
        DB::table('pengaturan_surat_layouts')->where('is_active', true)
            ->where('alamat', self::BARU['alamat'])
            ->update(['alamat' => self::LAMA_ALAMAT, 'updated_at' => now()]);
    }
};
