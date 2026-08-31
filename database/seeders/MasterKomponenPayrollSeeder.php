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
        ];

        foreach ($komponen as $item) {
            MasterKomponenPayroll::updateOrCreate(
                ['kode_komponen' => $item['kode_komponen']],
                $item
            );
        }
    }
}