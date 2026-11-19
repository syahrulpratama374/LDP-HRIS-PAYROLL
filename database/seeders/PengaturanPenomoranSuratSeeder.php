<?php

namespace Database\Seeders;

use App\Models\Pengaturan;
use App\Services\PenomoranSuratService;
use Illuminate\Database\Seeder;

/**
 * Pengaturan mode urutan nomor surat. firstOrCreate: nilai yang sudah diubah tidak pernah ditimpa.
 * Dipanggil dari PengaturanSeeder, dan bisa dijalankan sendiri dengan --class tanpa
 * ikut menimpa pengaturan lain.
 */
class PengaturanPenomoranSuratSeeder extends Seeder
{
    public function run(): void
    {
        Pengaturan::firstOrCreate(
            ['kunci' => PenomoranSuratService::KUNCI_MODE],
            [
                'nilai' => PenomoranSuratService::MODE_GLOBAL,
                'keterangan' => 'Urutan nomor surat (reset tiap tahun): global | per_jenis | per_penerbit.',
            ]
        );
    }
}
