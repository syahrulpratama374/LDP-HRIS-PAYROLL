<?php

namespace App\Services\Payroll;

use Carbon\Carbon;
use Illuminate\Support\Collection;

/**
 * Upah lembur. Mendukung lembur lintas tengah malam.
 * Metode "flat": jam × tarif per jam. Metode "kepmenaker": Kepmenaker 102/2004 (1/173 upah sebulan).
 */
class LemburCalculator
{
    /** Durasi dalam jam desimal; jam_selesai <= jam_mulai dianggap lewat tengah malam. */
    public function durasiJam(string $jamMulai, string $jamSelesai): float
    {
        $mulai = strtotime($jamMulai);
        $selesai = strtotime($jamSelesai);
        if ($selesai <= $mulai) {
            $selesai += 86400;
        }

        return round(($selesai - $mulai) / 3600, 2);
    }

    /**
     * @param  Collection  $lemburs  pengajuan lembur Disetujui (tanggal, jam_mulai, jam_selesai)
     * @param  float  $upahBulanan  gaji pokok + tunjangan tetap
     * @param  array<string, true>  $hariLibur  set tanggal (Y-m-d) libur nasional / cuti bersama
     * @return array{total: float, jam: float}
     */
    public function hitung(Collection $lemburs, float $upahBulanan, string $metode, float $tarifFlat, array $hariLibur = []): array
    {
        $total = 0.0;
        $jamTotal = 0.0;

        foreach ($lemburs as $lembur) {
            $jam = $this->durasiJam($lembur->jam_mulai, $lembur->jam_selesai);
            $jamTotal += $jam;

            if ($metode === 'kepmenaker') {
                $tanggal = Carbon::parse($lembur->tanggal);
                $libur = $tanggal->isWeekend() || isset($hariLibur[$tanggal->toDateString()]);
                $total += $this->upahKepmenaker($jam, $upahBulanan / 173, $libur);
            } else {
                $total += $jam * $tarifFlat;
            }
        }

        return ['total' => round($total), 'jam' => $jamTotal];
    }

    private function upahKepmenaker(float $jam, float $upahPerJam, bool $hariLibur): float
    {
        // Pengali per jam ke-n. Hari kerja: 1,5 lalu 2. Hari libur (5 hari kerja/minggu): 2 (jam 1–8), 3 (jam 9), 4 (jam 10+).
        $pengali = fn (int $ke) => $hariLibur
            ? ($ke <= 8 ? 2 : ($ke == 9 ? 3 : 4))
            : ($ke == 1 ? 1.5 : 2);

        $upah = 0.0;
        $sisa = $jam;
        for ($ke = 1; $sisa > 0; $ke++) {
            $bagian = min(1, $sisa);
            $upah += $bagian * $pengali($ke) * $upahPerJam;
            $sisa -= $bagian;
        }

        return $upah;
    }
}
