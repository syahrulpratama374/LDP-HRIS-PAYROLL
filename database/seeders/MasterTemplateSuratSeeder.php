<?php

namespace Database\Seeders;

use App\Models\MasterTemplateSurat;
use Illuminate\Database\Seeder;

class MasterTemplateSuratSeeder extends Seeder
{
    public function run(): void
    {
        // Idempoten: kunci pada kode_surat
        MasterTemplateSurat::updateOrCreate(['kode_surat' => 'SKK'], [
            'nama_template' => 'Surat Keterangan Kerja',
            'konten' => '<p>Menerangkan bahwa Saudara <strong>[NAMA_KARYAWAN]</strong> dengan NIK <strong>[NIK]</strong> benar merupakan karyawan aktif di PT LDP Jogja.</p>',
            'is_active' => true,
        ]);

        MasterTemplateSurat::updateOrCreate(['kode_surat' => 'ST'], [
            'nama_template' => 'Surat Tugas Keluar Kota',
            'konten' => '<p>Menugaskan Saudara <strong>[NAMA_KARYAWAN]</strong> untuk melaksanakan perjalanan dinas.</p>',
            'is_active' => true,
        ]);
    }
}
