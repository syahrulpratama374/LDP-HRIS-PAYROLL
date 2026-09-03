<?php

namespace Database\Seeders;

use App\Models\Pengaturan;
use Illuminate\Database\Seeder;

class PengaturanSeeder extends Seeder
{
    public function run(): void
    {
        $pengaturans = [
            [
                'kunci' => 'koordinat_kantor',
                'nilai' => '-7.795580, 110.369490', // Contoh titik koordinat pusat Jogja (Ganti dengan koordinat asli gedung LDP nanti)
                'keterangan' => 'Latitude dan Longitude gedung kantor LDP Jogja untuk titik pusat absensi.',
            ],
            [
                'kunci' => 'radius_absensi',
                'nilai' => '50',
                'keterangan' => 'Batas maksimal jarak absensi Karyawan dari kantor (dalam satuan meter).',
            ],
            [
                'kunci' => 'jam_masuk_operasional',
                'nilai' => '08:00',
                'keterangan' => 'Jam masuk standar kantor LDP Jogja.',
            ],
            [
                'kunci' => 'toleransi_keterlambatan',
                'nilai' => '15',
                'keterangan' => 'Batas toleransi keterlambatan absensi (dalam satuan menit).',
            ],
            [
                'kunci' => 'batas_approval_finance',
                'nilai' => '5000000',
                'keterangan' => 'Batas maksimal nominal (Rp) pencairan SPJ/Dana yang bisa disetujui Finance. Lebih dari ini wajib ke Direktur.',
            ],
            [
                'kunci' => 'default_cuti_tahunan',
                'nilai' => '12',
                'keterangan' => 'Jatah cuti tahunan bawaan yang diberikan saat Karyawan baru masuk.',
            ],
        ];

        foreach ($pengaturans as $pengaturan) {
            Pengaturan::updateOrCreate(
                ['kunci' => $pengaturan['kunci']],
                $pengaturan
            );
        }
    }
}