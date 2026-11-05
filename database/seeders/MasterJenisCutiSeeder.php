<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\MasterJenisCuti;

class MasterJenisCutiSeeder extends Seeder
{
    public function run(): void
    {
        $data = [
            [
                'nama_cuti' => 'Cuti Tahunan',
                'kuota_default' => 12,
                'potong_cuti_tahunan' => true, 
            ],
            [
                'nama_cuti' => 'Cuti Sakit',
                'kuota_default' => 14, // Asumsi batas tanpa rawat inap
                'potong_cuti_tahunan' => false,
            ],
            [
                'nama_cuti' => 'Cuti Melahirkan',
                'kuota_default' => 90,
                'potong_cuti_tahunan' => false,
            ],
            [
                'nama_cuti' => 'Cuti Menikah',
                'kuota_default' => 3,
                'potong_cuti_tahunan' => false,
            ],
        ];

        foreach ($data as $item) {
            MasterJenisCuti::create($item);
        }
    }
}