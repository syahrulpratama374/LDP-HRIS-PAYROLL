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
            [
                'kunci' => 'denda_terlambat',
                'nilai' => '50000',
                'keterangan' => 'Potongan per hari keterlambatan (Rp).',
            ],
            [
                'kunci' => 'tarif_lembur_per_jam',
                'nilai' => '25000',
                'keterangan' => 'Tarif lembur flat per jam (Rp), dipakai bila lembur_metode = flat.',
            ],
            [
                'kunci' => 'lembur_metode',
                'nilai' => 'flat',
                'keterangan' => 'Metode hitung lembur: flat (tarif per jam) atau kepmenaker (Kepmenaker 102/2004, 1/173 upah).',
            ],
            [
                'kunci' => 'hari_kerja_sebulan',
                'nilai' => '22',
                'keterangan' => 'Pembagi potongan Alpha per hari (hari kerja per bulan).',
            ],
            [
                'kunci' => 'kpi_ambang_bonus',
                'nilai' => '90',
                'keterangan' => 'Skor KPI minimum untuk mendapat bonus kinerja.',
            ],
            [
                'kunci' => 'kpi_bonus_persen',
                'nilai' => '10',
                'keterangan' => 'Bonus kinerja dalam persen dari gaji pokok.',
            ],
            [
                'kunci' => 'bpjs_jht_karyawan',
                'nilai' => '2',
                'keterangan' => 'Iuran JHT porsi karyawan (% dari upah).',
            ],
            [
                'kunci' => 'bpjs_jp_karyawan',
                'nilai' => '1',
                'keterangan' => 'Iuran JP porsi karyawan (% dari upah, maks. batas upah JP).',
            ],
            [
                'kunci' => 'bpjs_kes_karyawan',
                'nilai' => '1',
                'keterangan' => 'Iuran BPJS Kesehatan porsi karyawan (% dari upah, maks. batas upah Kesehatan).',
            ],
            [
                'kunci' => 'bpjs_jht_perusahaan',
                'nilai' => '3.7',
                'keterangan' => 'Iuran JHT porsi perusahaan (%).',
            ],
            [
                'kunci' => 'bpjs_jp_perusahaan',
                'nilai' => '2',
                'keterangan' => 'Iuran JP porsi perusahaan (%).',
            ],
            [
                'kunci' => 'bpjs_kes_perusahaan',
                'nilai' => '4',
                'keterangan' => 'Iuran BPJS Kesehatan porsi perusahaan (%).',
            ],
            [
                'kunci' => 'bpjs_jkk_perusahaan',
                'nilai' => '0.24',
                'keterangan' => 'Iuran JKK porsi perusahaan (%), sesuai kelas risiko.',
            ],
            [
                'kunci' => 'bpjs_jkm_perusahaan',
                'nilai' => '0.3',
                'keterangan' => 'Iuran JKM porsi perusahaan (%).',
            ],
            [
                'kunci' => 'bpjs_batas_upah_jp',
                'nilai' => '10547400',
                'keterangan' => 'Batas atas upah untuk iuran JP (Rp). Perbarui setiap tahun sesuai ketentuan BPJS.',
            ],
            [
                'kunci' => 'bpjs_batas_upah_kes',
                'nilai' => '12000000',
                'keterangan' => 'Batas atas upah untuk iuran BPJS Kesehatan (Rp).',
            ],
            [
                'kunci' => 'biaya_jabatan_persen',
                'nilai' => '5',
                'keterangan' => 'Biaya jabatan PPh 21 (% dari bruto setahun).',
            ],
            [
                'kunci' => 'biaya_jabatan_maks_tahunan',
                'nilai' => '6000000',
                'keterangan' => 'Batas maksimal biaya jabatan setahun (Rp).',
            ],
            [
                'kunci' => 'rasio_maks_cicilan_kasbon',
                'nilai' => '30',
                'keterangan' => 'Total cicilan kasbon aktif maksimal (% dari gaji pokok).',
            ],
        ];

        foreach ($pengaturans as $pengaturan) {
            Pengaturan::updateOrCreate(
                ['kunci' => $pengaturan['kunci']],
                $pengaturan
            );
        }

        // Kunci yang tidak boleh ditimpa (firstOrCreate), mis. penomoran_surat_mode
        $this->call(PengaturanPenomoranSuratSeeder::class);
    }
}