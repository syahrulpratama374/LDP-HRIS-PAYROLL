<?php

namespace App\Services\Spj;

use App\Models\Spj;
use App\Models\SpjBiaya;
use App\Models\SpjPembayaran;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Penutupan SPJ (B9):
 * - Selesai: hanya Finance, SPJ Disetujui, dan semua syarat terpenuhi (uang harian & reimburse semua peserta
 *   lunas, tidak ada nota Menunggu, risalah terisi). Setelah Selesai, nota/pembayaran/risalah/koordinator terkunci
 *   (semua aksi tersebut mensyaratkan status Disetujui).
 * - Dibatalkan: Draft dihapus (bukan dibatalkan); Diajukan/Ditolak dibatalkan oleh pengaju (alasan opsional);
 *   Disetujui dibatalkan HC dengan alasan wajib, hanya bila belum ada pembayaran AKTIF (pembayaran yang sudah
 *   dibatalkan dan nota tidak menghalangi). Nomor surat tetap tercatat dan tidak dipakai ulang.
 */
class PenutupanSpjService
{
    public const ROLE_SELESAI = [4]; // Finance

    public const ROLE_BATAL_SETELAH_SETUJU = [3]; // HC

    public function __construct(
        private PembayaranSpjService $pembayaran,
        private RisalahSpjService $risalah,
    ) {}

    /**
     * Syarat Selesai yang BELUM terpenuhi (kosong = boleh ditandai Selesai).
     *
     * @return string[]
     */
    public function syaratBelumTerpenuhi(Spj $spj): array
    {
        if ($spj->status !== Spj::STATUS_DISETUJUI) {
            return ["SPJ berstatus {$spj->status}; hanya SPJ Disetujui yang dapat ditandai Selesai."];
        }
        $spj->loadMissing('pesertas');
        $belum = [];

        $uh = $spj->pesertas->filter(fn ($p) => ! in_array($this->pembayaran->status($p)['uang_harian']['status'], ['Lunas', 'Tidak ada'], true));
        if ($uh->isNotEmpty()) {
            $belum[] = 'Uang harian belum lunas: '.$uh->pluck('nama')->join(', ').'.';
        }

        $menunggu = SpjBiaya::whereIn('spj_peserta_id', $spj->pesertas->pluck('id'))->where('status', SpjBiaya::MENUNGGU)->count();
        if ($menunggu > 0) {
            $belum[] = "Masih ada {$menunggu} nota menunggu validasi Finance.";
        }

        $rb = $spj->pesertas->filter(fn ($p) => ! in_array($this->pembayaran->status($p)['reimburse']['status'], ['Lunas', 'Tidak ada'], true));
        if ($rb->isNotEmpty()) {
            $belum[] = 'Reimburse belum lunas sesuai nota tervalidasi: '.$rb->pluck('nama')->join(', ').'.';
        }

        if (! $this->risalah->risalahTerisi($spj)) {
            $belum[] = 'Risalah perjalanan dinas belum diisi.';
        }

        return $belum;
    }

    public function bolehMenandaiSelesai(?User $user): bool
    {
        return $user !== null && in_array((int) $user->role_id, self::ROLE_SELESAI, true);
    }

    /** @throws \DomainException */
    public function selesaikan(Spj $spj, User $oleh): Spj
    {
        return DB::transaction(function () use ($spj, $oleh) {
            $spj = Spj::lockForUpdate()->findOrFail($spj->id);
            $belum = $this->syaratBelumTerpenuhi($spj);
            if ($belum) {
                throw new \DomainException('SPJ belum dapat ditandai Selesai. '.implode(' ', $belum));
            }
            $spj->update(['status' => Spj::STATUS_SELESAI, 'diselesaikan_pada' => now(), 'diselesaikan_oleh' => $oleh->id]);

            return $spj->fresh();
        });
    }

    /**
     * Alasan $user tidak boleh membatalkan SPJ ini (null = boleh).
     */
    public function alasanTidakBisaBatal(User $user, Spj $spj): ?string
    {
        $pengaju = (int) $spj->dibuat_oleh === (int) $user->id;

        return match ($spj->status) {
            Spj::STATUS_DRAFT => 'Draf belum diajukan: gunakan Hapus Draf.',
            Spj::STATUS_DIAJUKAN, Spj::STATUS_DITOLAK => $pengaju ? null : 'Sebelum disetujui, hanya pengaju yang dapat membatalkan SPJ.',
            Spj::STATUS_DISETUJUI => match (true) {
                ! in_array((int) $user->role_id, self::ROLE_BATAL_SETELAH_SETUJU, true) => 'SPJ yang sudah disetujui hanya dapat dibatalkan oleh HC.',
                $this->adaPembayaranAktif($spj) => 'SPJ tidak dapat dibatalkan karena sudah ada pembayaran tercatat. Batalkan pencatatan pembayaran terlebih dahulu (Finance).',
                default => null,
            },
            default => "SPJ berstatus {$spj->status} tidak dapat dibatalkan.",
        };
    }

    /** Alasan wajib bila SPJ sudah Disetujui. */
    public function alasanWajib(Spj $spj): bool
    {
        return $spj->status === Spj::STATUS_DISETUJUI;
    }

    /** @throws \DomainException */
    public function batalkan(Spj $spj, User $oleh, ?string $alasan): Spj
    {
        return DB::transaction(function () use ($spj, $oleh, $alasan) {
            $spj = Spj::lockForUpdate()->findOrFail($spj->id);
            if ($tolak = $this->alasanTidakBisaBatal($oleh, $spj)) {
                throw new \DomainException($tolak);
            }
            if ($this->alasanWajib($spj) && blank($alasan)) {
                throw new \DomainException('Alasan pembatalan wajib diisi.');
            }
            $spj->update([
                'status' => Spj::STATUS_DIBATALKAN, 'dibatalkan_pada' => now(), 'dibatalkan_oleh' => $oleh->id,
                'alasan_batal' => filled($alasan) ? trim($alasan) : null,
            ]);

            return $spj->fresh();
        });
    }

    public function adaPembayaranAktif(Spj $spj): bool
    {
        return SpjPembayaran::aktif()->whereIn('spj_peserta_id', $spj->pesertas()->pluck('id'))->exists();
    }
}
