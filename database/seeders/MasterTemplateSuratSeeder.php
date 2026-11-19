<?php

namespace Database\Seeders;

use App\Models\MasterTemplateSurat;
use Illuminate\Database\Seeder;

/**
 * Jenis surat perusahaan (master_template_surats). Aman diulang dan TIDAK menimpa:
 * - Ganti kode lama SKK -> SKET dan ST -> STU hanya bila kode lama ada dan kode baru belum ada.
 *   Yang diubah hanya kolom kode_surat (id, nama, konten, rute approval tetap); dicatat di output.
 *   Nomor surat yang sudah terbit dengan kode lama tidak diubah (nomor historis).
 * - Jenis lain hanya dibuat bila kodenya belum ada; baris yang sudah ada tidak disentuh.
 */
class MasterTemplateSuratSeeder extends Seeder
{
    public const GANTI_KODE = ['SKK' => 'SKET', 'ST' => 'STU'];

    /** kode => nama jenis surat */
    public const JENIS = [
        'SP' => 'Surat Pernyataan',
        'SKEP' => 'Surat Keputusan',
        'SK' => 'Surat Kuasa',
        'SM' => 'Surat Permohonan',
        'SKET' => 'Surat Keterangan',
        'STU' => 'Surat Tugas',
        'PKS' => 'Perjanjian Kerja Sama (Umum)',
        'PKS-IPR' => 'Perjanjian Kerja Sama Iprime',
        'PKS-CUST' => 'Perjanjian Kerja Sama Customer',
        'BA' => 'Berita Acara',
        'BAKES' => 'Berita Acara Kesepakatan',
        'SE' => 'Surat Edaran',
        'SPK' => 'Surat Pengalaman Kerja',
        'SPH' => 'Surat Perjanjian Hibah',
        'SPJ-PD' => 'SPJ Biaya Perjalanan Dinas',
    ];

    public function run(): void
    {
        foreach (self::GANTI_KODE as $lama => $baru) {
            $templateLama = $this->cari($lama);
            if (! $templateLama) {
                continue;
            }
            if ($this->cari($baru)) {
                $this->command?->warn("Kode {$lama} dan {$baru} sama-sama ada; tidak ada yang diubah.");

                continue;
            }
            $templateLama->update(['kode_surat' => $baru]);
            $this->command?->warn("Kode jenis surat diganti: {$lama} -> {$baru} (id {$templateLama->id}, isi tetap).");
        }

        foreach (self::JENIS as $kode => $nama) {
            if ($this->cari($kode)) {
                continue;
            }
            MasterTemplateSurat::create([
                'kode_surat' => $kode,
                'nama_template' => $nama,
                'konten' => '<p>[Isi '.e($nama).']</p>',
                'is_active' => true,
            ]);
        }
    }

    /** Cari tanpa membedakan huruf besar/kecil (SQLite case-sensitive, MySQL tidak). */
    private function cari(string $kode): ?MasterTemplateSurat
    {
        return MasterTemplateSurat::whereRaw('UPPER(kode_surat) = ?', [strtoupper($kode)])->orderBy('id')->first();
    }
}
