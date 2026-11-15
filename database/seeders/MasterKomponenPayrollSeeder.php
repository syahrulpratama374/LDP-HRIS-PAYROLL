<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\MasterKomponenPayroll;

class MasterKomponenPayrollSeeder extends Seeder
{
    public function run(): void
    {
        $komponen = [
            [
                'kode_komponen' => 'GP',
                'nama_komponen' => 'Gaji Pokok',
                'jenis' => 'Pemasukan',
                'is_taxable' => true
            ],
            [
                'kode_komponen' => 'TJ',
                'nama_komponen' => 'Tunjangan Jabatan',
                'jenis' => 'Pemasukan',
                'is_taxable' => true
            ],
            [
                'kode_komponen' => 'LBR',
                'nama_komponen' => 'Uang Lembur',
                'jenis' => 'Pemasukan',
                'is_taxable' => true
            ],
            [
                'kode_komponen' => 'SPJ',
                'nama_komponen' => 'Pencairan Dana SPJ',
                'jenis' => 'Pemasukan',
                'is_taxable' => false // SPJ (Reimbursement) biasanya tidak kena pajak PPh 21
            ],
            [
                'kode_komponen' => 'KASBON',
                'nama_komponen' => 'Potongan Cicilan Kasbon',
                'jenis' => 'Potongan',
                'is_taxable' => false
            ],
            [
                'kode_komponen' => 'BPJS-KS',
                'nama_komponen' => 'Iuran BPJS Kesehatan',
                'jenis' => 'Potongan',
                'is_taxable' => false
            ],
            [
                'kode_komponen' => 'BONUS-KPI',
                'nama_komponen' => 'Bonus Kinerja',
                'jenis' => 'Pemasukan',
                'is_taxable' => true,
            ],
            [
                'kode_komponen' => 'POT-ABSEN',
                'nama_komponen' => 'Potongan Absensi',
                'jenis' => 'Potongan',
                'is_taxable' => false,
            ],
            [
                'kode_komponen' => 'BPJS-JHT',
                'nama_komponen' => 'Iuran BPJS JHT',
                'jenis' => 'Potongan',
                'is_taxable' => false,
            ],
            [
                'kode_komponen' => 'BPJS-JP',
                'nama_komponen' => 'Iuran BPJS JP',
                'jenis' => 'Potongan',
                'is_taxable' => false,
            ],
            [
                'kode_komponen' => 'PPH21',
                'nama_komponen' => 'Pajak PPh 21',
                'jenis' => 'Potongan',
                'is_taxable' => false,
            ],
        ];

        foreach ($komponen as $item) {
            MasterKomponenPayroll::updateOrCreate(
                ['kode_komponen' => $item['kode_komponen']],
                $item
            );
        }
    }
}