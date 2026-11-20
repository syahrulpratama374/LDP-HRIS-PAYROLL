<?php

namespace App\Services\Spj;

use App\Models\Spj;
use App\Models\SpjBiaya;
use App\Models\SpjPembayaran;
use App\Models\SpjPeserta;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Pembayaran SPJ per peserta (di luar payroll), dicatat Finance dengan bukti transfer:
 * - uang_harian: total dicatat ≤ total uang harian peserta (snapshot).
 * - reimburse : total dicatat ≤ total nota TERVALIDASI peserta (spj_biayas.nominal_dibayar).
 * Hanya saat SPJ Disetujui. Bukti transfer & rekening lengkap hanya untuk Admin/HC/Finance dan peserta pemilik.
 * Pembatalan hanya MENANDAI pembayaran (alasan, oleh, kapan); baris & bukti tetap disimpan, tidak dihitung ke total.
 */
class PembayaranSpjService
{
    /** Role yang mencatat & membatalkan pembayaran: Finance. */
    public const ROLE_CATAT = [4];

    public function bolehCatat(?User $user): bool
    {
        return $user !== null && in_array((int) $user->role_id, self::ROLE_CATAT, true);
    }

    /** Bukti transfer memuat rekening: Admin/HC/Finance dan peserta pemilik pembayaran. */
    public function bolehLihatBukti(?User $user, SpjPeserta $peserta): bool
    {
        return RekeningSpj::bolehLihatPenuh($user)
            || ($user?->karyawan?->id !== null && (int) $user->karyawan->id === (int) $peserta->karyawan_id);
    }

    /**
     * Status pembayaran satu peserta.
     *
     * @return array{uang_harian: array{hak: float, dibayar: float, sisa: float, status: string},
     *               reimburse: array{hak: float, dibayar: float, sisa: float, status: string}}
     */
    public function status(SpjPeserta $peserta): array
    {
        // Pembayaran yang dibatalkan tidak dihitung
        $dibayar = SpjPembayaran::where('spj_peserta_id', $peserta->id)->aktif()
            ->selectRaw('jenis, COALESCE(SUM(nominal), 0) as total')
            ->groupBy('jenis')->pluck('total', 'jenis');

        $hakUh = (float) $peserta->total_uang_harian;
        $hakRb = $this->reimburseTervalidasi($peserta);

        return [
            'uang_harian' => $this->ringkas($hakUh, (float) ($dibayar[SpjPembayaran::UANG_HARIAN] ?? 0)),
            'reimburse' => $this->ringkas($hakRb, (float) ($dibayar[SpjPembayaran::REIMBURSE] ?? 0)),
        ];
    }

    /** Uang harian SEMUA peserta sudah dicatat lunas (syarat penutupan B9); hak 0 dianggap tuntas. */
    public function uangHarianLunasSemua(Spj $spj): bool
    {
        return $spj->pesertas()->get()->every(
            fn (SpjPeserta $p) => in_array($this->status($p)['uang_harian']['status'], ['Lunas', 'Tidak ada'], true)
        );
    }

    public function reimburseTervalidasi(SpjPeserta $peserta): float
    {
        return (float) SpjBiaya::where('spj_peserta_id', $peserta->id)
            ->where('status', SpjBiaya::DIVALIDASI)->sum('nominal_dibayar');
    }

    /**
     * Catat pembayaran. Mengunci baris pembayaran peserta agar dua pencatatan bersamaan tidak melampaui hak.
     *
     * @throws \DomainException
     */
    public function catat(SpjPeserta $peserta, User $oleh, string $jenis, float $nominal, string $tanggal, string $buktiPath, ?string $catatan): SpjPembayaran
    {
        return DB::transaction(function () use ($peserta, $oleh, $jenis, $nominal, $tanggal, $buktiPath, $catatan) {
            $peserta = SpjPeserta::with('spj')->lockForUpdate()->findOrFail($peserta->id);
            SpjPembayaran::where('spj_peserta_id', $peserta->id)->lockForUpdate()->get();

            if ($peserta->spj->status !== Spj::STATUS_DISETUJUI) {
                throw new \DomainException("Pembayaran tidak dapat dicatat: SPJ berstatus {$peserta->spj->status}.");
            }
            if (blank($peserta->rekening_encrypted) || RekeningSpj::polos($peserta->rekening_encrypted) === null) {
                throw new \DomainException("Peserta {$peserta->nama} belum memiliki rekening; pembayaran tidak dapat dicatat.");
            }
            if ($nominal <= 0) {
                throw new \DomainException('Nominal pembayaran harus lebih dari 0.');
            }

            $st = $this->status($peserta)[$jenis];
            if (round($nominal, 2) > round($st['sisa'], 2)) {
                $label = $jenis === SpjPembayaran::REIMBURSE ? 'total nota tervalidasi' : 'total uang harian';
                throw new \DomainException('Nominal melebihi sisa yang belum dibayar (Rp '
                    .number_format($st['sisa'], 0, ',', '.')."). Batasnya {$label} peserta: Rp "
                    .number_format($st['hak'], 0, ',', '.').'.');
            }

            return SpjPembayaran::create([
                'spj_peserta_id' => $peserta->id,
                'jenis' => $jenis,
                'nominal' => round($nominal, 2),
                'tanggal_transfer' => $tanggal,
                'bukti_transfer_path' => $buktiPath,
                'rekening_encrypted' => $peserta->rekening_encrypted,
                'dicatat_oleh' => $oleh->id,
                'catatan' => $catatan,
            ]);
        }, 3);
    }

    /**
     * Tandai pembayaran sebagai dibatalkan (bukti transfer tetap disimpan).
     *
     * @throws \DomainException
     */
    public function batalkan(SpjPembayaran $pembayaran, User $oleh, string $alasan): SpjPembayaran
    {
        return DB::transaction(function () use ($pembayaran, $oleh, $alasan) {
            $pembayaran = SpjPembayaran::with('peserta.spj')->lockForUpdate()->findOrFail($pembayaran->id);
            if ($pembayaran->dibatalkan()) {
                throw new \DomainException('Pembayaran ini sudah dibatalkan.');
            }
            if ($pembayaran->peserta->spj->status !== Spj::STATUS_DISETUJUI) {
                throw new \DomainException("Pembayaran tidak dapat dibatalkan: SPJ berstatus {$pembayaran->peserta->spj->status}.");
            }
            $pembayaran->update(['dibatalkan_pada' => now(), 'dibatalkan_oleh' => $oleh->id, 'alasan_batal' => $alasan]);

            return $pembayaran->fresh();
        });
    }

    /** @return array{hak: float, dibayar: float, sisa: float, status: string} */
    private function ringkas(float $hak, float $dibayar): array
    {
        $sisa = max(0.0, round($hak - $dibayar, 2));
        $status = match (true) {
            $hak <= 0 && $dibayar <= 0 => 'Tidak ada',
            $sisa <= 0 => 'Lunas',
            $dibayar > 0 => 'Sebagian',
            default => 'Belum dibayar',
        };

        return ['hak' => $hak, 'dibayar' => $dibayar, 'sisa' => $sisa, 'status' => $status];
    }
}
