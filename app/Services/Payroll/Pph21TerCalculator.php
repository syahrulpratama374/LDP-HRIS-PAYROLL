<?php

namespace App\Services\Payroll;

use App\Models\MasterTarifTer;

/**
 * PPh 21 dengan metode TER (PP 58/2023): Jan–Nov tarif TER × bruto bulanan,
 * Desember memakai tarif Pasal 17 atas penghasilan setahun dikurangi PPh Jan–Nov.
 */
class Pph21TerCalculator
{
    /** @var array<string, \Illuminate\Support\Collection>|null */
    private ?array $tabel = null;

    // Pemetaan cadangan bila kolom kategori_ter belum terisi (PP 58/2023)
    private const KATEGORI_KODE = [
        'TK/0' => 'A', 'TK/1' => 'A', 'K/0' => 'A',
        'TK/2' => 'B', 'TK/3' => 'B', 'K/1' => 'B', 'K/2' => 'B',
        'K/3' => 'C',
    ];

    // Lapisan tarif Pasal 17 UU PPh: [batas atas PKP, tarif]
    private const LAPISAN_PASAL_17 = [
        [60_000_000, 0.05],
        [250_000_000, 0.15],
        [500_000_000, 0.25],
        [5_000_000_000, 0.30],
        [PHP_FLOAT_MAX, 0.35],
    ];

    public function kategori(?string $kategoriTer, ?string $kodePtkp): string
    {
        return $kategoriTer ?: (self::KATEGORI_KODE[$kodePtkp] ?? 'A');
    }

    /** Tarif TER (persen) untuk kategori & bruto bulanan. */
    public function tarifTer(string $kategori, float $bruto): float
    {
        $this->tabel ??= MasterTarifTer::orderBy('batas_bawah')->get()->groupBy('kategori')->all();

        $baris = ($this->tabel[$kategori] ?? collect())
            ->last(fn ($r) => (float) $r->batas_bawah <= floor($bruto));

        return $baris ? (float) $baris->tarif : 0.0;
    }

    /** Jan–Nov. @return array{pph: float, rincian: array} */
    public function hitungBulanan(string $kategori, float $bruto): array
    {
        $tarif = $this->tarifTer($kategori, $bruto);

        return [
            'pph' => round($bruto * $tarif / 100),
            'rincian' => [
                'metode' => 'TER',
                'kategori' => $kategori,
                'tarif' => $tarif,
                'bruto_bulanan' => round($bruto),
            ],
        ];
    }

    /**
     * Desember — rekonsiliasi Pasal 17.
     *
     * @param  float  $brutoSetahun  bruto Jan–Des (sudah termasuk bulan Desember)
     * @param  float  $iuranPensiunSetahun  JHT + JP porsi karyawan Jan–Des
     * @param  float  $pphSudahDipotong  PPh Jan–Nov
     * @return array{pph: float, rincian: array, peringatan: ?string}
     */
    public function hitungDesember(
        string $kategori,
        float $brutoSetahun,
        float $iuranPensiunSetahun,
        float $ptkpTahunan,
        float $pphSudahDipotong,
        float $biayaJabatanPersen,
        float $biayaJabatanMaks,
    ): array {
        $biayaJabatan = min($brutoSetahun * $biayaJabatanPersen / 100, $biayaJabatanMaks);
        $neto = $brutoSetahun - $biayaJabatan - $iuranPensiunSetahun;
        $pkp = (float) max(0, floor(($neto - $ptkpTahunan) / 1000) * 1000);
        $pphSetahun = $this->pasal17($pkp);
        $selisih = $pphSetahun - $pphSudahDipotong;

        return [
            'pph' => (float) max(0, round($selisih)),
            'peringatan' => $selisih < 0
                ? 'PPh 21 Januari–November melebihi PPh setahun (lebih potong Rp ' . number_format(abs($selisih), 0, ',', '.') . '); dikembalikan manual.'
                : null,
            'rincian' => [
                'metode' => 'Pasal 17 (Desember)',
                'kategori' => $kategori,
                'bruto_setahun' => round($brutoSetahun),
                'biaya_jabatan' => round($biayaJabatan),
                'iuran_pensiun' => round($iuranPensiunSetahun),
                'ptkp' => round($ptkpTahunan),
                'pkp' => $pkp,
                'pph_setahun' => round($pphSetahun),
                'pph_jan_nov' => round($pphSudahDipotong),
            ],
        ];
    }

    public function pasal17(float $pkp): float
    {
        $pajak = 0.0;
        $batasBawah = 0.0;
        foreach (self::LAPISAN_PASAL_17 as [$batasAtas, $tarif]) {
            if ($pkp <= $batasBawah) {
                break;
            }
            $pajak += (min($pkp, $batasAtas) - $batasBawah) * $tarif;
            $batasBawah = $batasAtas;
        }

        return $pajak;
    }
}
