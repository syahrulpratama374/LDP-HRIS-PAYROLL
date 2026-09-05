<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\MasterTemplateSurat;

class MasterTemplateSuratSeeder extends Seeder
{
    public function run()
    {
        MasterTemplateSurat::create([
            'nama_template' => 'Surat Keterangan Kerja',
            'kode_surat' => 'SKK',
            'konten' => '<p>Menerangkan bahwa Saudara <strong>[NAMA_KARYAWAN]</strong> dengan NIK <strong>[NIK]</strong> benar merupakan karyawan aktif di PT LDP Jogja.</p>',
            'is_active' => true,
        ]);

        MasterTemplateSurat::create([
            'nama_template' => 'Surat Tugas Keluar Kota',
            'kode_surat' => 'ST',
            'konten' => '<p>Menugaskan Saudara <strong>[NAMA_KARYAWAN]</strong> untuk melaksanakan perjalanan dinas.</p>',
            'is_active' => true,
        ]);
    }
}