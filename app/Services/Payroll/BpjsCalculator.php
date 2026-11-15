<?php

namespace App\Services\Payroll;

/**
 * Iuran BPJS: porsi karyawan (dipotong) dan porsi perusahaan (informasi + masuk bruto pajak
 * untuk JKK, JKM, Kesehatan). Persentase & batas upah dari tabel Pengaturan.
 */
class BpjsCalculator
{
    /**
     * @param  float  $upah  upah tetap (gaji pokok + tunjangan tetap)
     * @param  array<string, float>  $cfg  nilai Pengaturan (angka)
     */
    public function hitung(float $upah, array $cfg): array
    {
        $upahJp = min($upah, $cfg['bpjs_batas_upah_jp']);
        $upahKes = min($upah, $cfg['bpjs_batas_upah_kes']);

        $jht = round($upah * $cfg['bpjs_jht_karyawan'] / 100);
        $jp = round($upahJp * $cfg['bpjs_jp_karyawan'] / 100);
        $kes = round($upahKes * $cfg['bpjs_kes_karyawan'] / 100);

        $jhtP = round($upah * $cfg['bpjs_jht_perusahaan'] / 100);
        $jpP = round($upahJp * $cfg['bpjs_jp_perusahaan'] / 100);
        $kesP = round($upahKes * $cfg['bpjs_kes_perusahaan'] / 100);
        $jkk = round($upah * $cfg['bpjs_jkk_perusahaan'] / 100);
        $jkm = round($upah * $cfg['bpjs_jkm_perusahaan'] / 100);

        return [
            'jht' => $jht,
            'jp' => $jp,
            'kes' => $kes,
            'total_karyawan' => $jht + $jp + $kes,
            'iuran_pensiun' => $jht + $jp,
            'total_perusahaan' => $jhtP + $jpP + $kesP + $jkk + $jkm,
            // Premi yang ditanggung perusahaan & dihitung sebagai penghasilan bruto (PMK 168/2023)
            'premi_bruto' => $jkk + $jkm + $kesP,
        ];
    }
}
