<?php

namespace App\Services;

use App\Models\Pengaturan;
use App\Models\PinjamanKaryawan;
use App\Models\RiwayatGaji;

/**
 * Aturan limit kasbon:
 *  1. Maksimal 1 kasbon aktif/pending per karyawan (Pending, Disetujui Atasan, Berjalan).
 *  2. Total cicilan per bulan (aktif + pengajuan baru) <= rasio × gaji pokok berlaku.
 */
class KasbonLimitService
{
    public const STATUS_AKTIF = ['Pending', 'Disetujui Atasan', 'Berjalan'];
    public const RASIO_DEFAULT = 30;

    public function rasioMaks(): float
    {
        $nilai = Pengaturan::where('kunci', 'rasio_maks_cicilan_kasbon')->value('nilai');

        return is_numeric($nilai) && $nilai > 0 ? (float) $nilai : self::RASIO_DEFAULT;
    }

    /** Gaji pokok dari RiwayatGaji yang berlaku hari ini (periode aktif terbaru). */
    public function gajiPokok(int $karyawanId): float
    {
        $hari = now()->toDateString();

        return (float) RiwayatGaji::where('karyawan_id', $karyawanId)
            ->whereDate('effective_date_start', '<=', $hari)
            ->where(fn ($q) => $q->whereNull('effective_date_end')->orWhereDate('effective_date_end', '>=', $hari))
            ->orderByDesc('effective_date_start')
            ->value('nominal_gaji_pokok');
    }

    public function kasbonAktif(int $karyawanId, ?int $kecualiId = null): ?PinjamanKaryawan
    {
        return PinjamanKaryawan::where('karyawan_id', $karyawanId)
            ->whereIn('status', self::STATUS_AKTIF)
            ->when($kecualiId, fn ($q) => $q->where('id', '!=', $kecualiId))
            ->orderBy('id')
            ->first();
    }

    /** Total cicilan per bulan dari kasbon aktif (tidak termasuk $kecualiId). */
    public function cicilanAktifPerBulan(int $karyawanId, ?int $kecualiId = null): float
    {
        return (float) PinjamanKaryawan::where('karyawan_id', $karyawanId)
            ->whereIn('status', self::STATUS_AKTIF)
            ->when($kecualiId, fn ($q) => $q->where('id', '!=', $kecualiId))
            ->get()
            ->sum(fn ($p) => $this->cicilanPerBulan((float) $p->total_pinjaman, (int) $p->tenor_bulan));
    }

    public function cicilanPerBulan(float $total, int $tenor): float
    {
        return $tenor > 0 ? round($total / $tenor, 0) : $total;
    }

    /** Ringkasan plafon karyawan (untuk tampilan form). */
    public function plafon(int $karyawanId, ?int $kecualiId = null): array
    {
        $gaji = $this->gajiPokok($karyawanId);
        $rasio = $this->rasioMaks();
        $batas = round($gaji * $rasio / 100, 0);
        $aktif = $this->cicilanAktifPerBulan($karyawanId, $kecualiId);
        $kasbon = $this->kasbonAktif($karyawanId, $kecualiId);

        return [
            'gaji_pokok' => $gaji,
            'rasio_maks' => $rasio,
            'batas_cicilan' => $batas,
            'cicilan_aktif' => $aktif,
            'sisa_plafon_cicilan' => max(0, $batas - $aktif),
            'kasbon_aktif' => $kasbon ? [
                'id' => $kasbon->id,
                'status' => $kasbon->status,
                'total_pinjaman' => (float) $kasbon->total_pinjaman,
            ] : null,
        ];
    }

    /** Evaluasi kelayakan satu pengajuan. $kecualiId = kasbon yang sedang dievaluasi ulang (saat approve). */
    public function evaluasi(int $karyawanId, float $total, int $tenor, ?int $kecualiId = null): array
    {
        $plafon = $this->plafon($karyawanId, $kecualiId);
        $cicilanBaru = $this->cicilanPerBulan($total, $tenor);
        $alasan = [];

        if ($plafon['kasbon_aktif']) {
            $alasan[] = "Anda masih memiliki kasbon #{$plafon['kasbon_aktif']['id']} berstatus {$plafon['kasbon_aktif']['status']}. Maksimal 1 kasbon aktif/pending.";
        }

        if ($plafon['gaji_pokok'] <= 0) {
            $alasan[] = 'Gaji pokok aktif tidak ditemukan, pengajuan tidak dapat diproses.';
        } elseif ($plafon['cicilan_aktif'] + $cicilanBaru > $plafon['batas_cicilan']) {
            $alasan[] = 'Total cicilan per bulan (Rp ' . number_format($plafon['cicilan_aktif'] + $cicilanBaru, 0, ',', '.')
                . ") melebihi batas {$plafon['rasio_maks']}% gaji pokok (Rp " . number_format($plafon['batas_cicilan'], 0, ',', '.') . ').';
        }

        return $plafon + [
            'cicilan_baru' => $cicilanBaru,
            'maks_pinjaman' => $plafon['sisa_plafon_cicilan'] * max(1, $tenor),
            'layak' => empty($alasan),
            'alasan' => $alasan,
        ];
    }
}
