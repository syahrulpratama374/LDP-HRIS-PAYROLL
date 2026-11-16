<?php

namespace App\Services;

use App\Models\Pengaturan;
use App\Models\PinjamanKaryawan;
use App\Models\RiwayatGaji;

/**
 * Aturan limit kasbon:
 *  1. Maksimal 1 kasbon aktif/pending per karyawan (Pending, Disetujui Atasan, Berjalan).
 *  2. Total cicilan per bulan (aktif + pengajuan baru) <= rasio × gaji pokok berlaku.
 *  3. Nominal tidak melebihi sisa plafon per jenis kasbon (Pengaturan maksimal_kasbon_finance / maksimal_kasbon_divisi).
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

    /** Plafon nominal per jenis kasbon dari Pengaturan (default Finance 5 jt, Divisi 1 jt). */
    public function plafonJenis(string $jenis): float
    {
        $kunci = $jenis === 'Divisi' ? 'maksimal_kasbon_divisi' : 'maksimal_kasbon_finance';
        $nilai = Pengaturan::where('kunci', $kunci)->value('nilai');

        return is_numeric($nilai) ? (float) $nilai : ($jenis === 'Divisi' ? 1000000 : 5000000);
    }

    /** Sisa plafon nominal per jenis: plafon - sisa_pinjaman kasbon aktif/pending jenis tsb (tidak termasuk $kecualiId). */
    public function sisaLimitJenis(int $karyawanId, string $jenis, ?int $kecualiId = null): float
    {
        $terpakai = (float) PinjamanKaryawan::where('karyawan_id', $karyawanId)
            ->where('jenis_kasbon', $jenis)
            ->whereIn('status', self::STATUS_AKTIF)
            ->when($kecualiId, fn ($q) => $q->where('id', '!=', $kecualiId))
            ->sum('sisa_pinjaman');

        return max(0, $this->plafonJenis($jenis) - $terpakai);
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
            'sisa_limit_finance' => $this->sisaLimitJenis($karyawanId, 'Finance', $kecualiId),
            'sisa_limit_divisi' => $this->sisaLimitJenis($karyawanId, 'Divisi', $kecualiId),
            'kasbon_aktif' => $kasbon ? [
                'id' => $kasbon->id,
                'status' => $kasbon->status,
                'total_pinjaman' => (float) $kasbon->total_pinjaman,
            ] : null,
        ];
    }

    /** Evaluasi kelayakan satu pengajuan. $kecualiId = kasbon yang sedang dievaluasi ulang (saat approve). */
    public function evaluasi(int $karyawanId, float $total, int $tenor, ?int $kecualiId = null, ?string $jenis = null): array
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

        if ($jenis) {
            $sisaJenis = $jenis === 'Divisi' ? $plafon['sisa_limit_divisi'] : $plafon['sisa_limit_finance'];
            if ($total > $sisaJenis) {
                $alasan[] = "Nominal melebihi sisa limit Kasbon {$jenis} Anda (Rp " . number_format($sisaJenis, 0, ',', '.') . ').';
            }
        }

        return $plafon + [
            'cicilan_baru' => $cicilanBaru,
            'maks_pinjaman' => $plafon['sisa_plafon_cicilan'] * max(1, $tenor),
            'layak' => empty($alasan),
            'alasan' => $alasan,
        ];
    }
}
