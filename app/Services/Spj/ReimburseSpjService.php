<?php

namespace App\Services\Spj;

use App\Models\Spj;
use App\Models\SpjBiaya;
use App\Models\SpjPeserta;
use App\Models\SpjSelisihPenginapan;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Aturan nota & reimburse SPJ (satu sumber untuk controller, halaman detail, dan PDF):
 * - Nota diunggah setelah SPJ Disetujui oleh pengaju, koordinator, atau peserta (untuk dirinya sendiri).
 * - Finance memvalidasi. Penginapan: dibayar = min(nota, sisa batas penginapan peserta), batas berlaku untuk
 *   TOTAL nota penginapan per peserta; kelebihan ditanggung peserta. Provinsi tanpa tarif penginapan:
 *   nominal dibayar diisi manual Finance, tanpa catatan selisih. Jenis lain: dibayar sesuai nota.
 * - Saat nota penginapan divalidasi (dan tarif ada) selisih per malam dicatat: peringatan bila nota > tarif,
 *   info bila lebih murah.
 */
class ReimburseSpjService
{
    /** Role yang memvalidasi nota: Finance. */
    public const ROLE_VALIDASI = [4];

    public function bolehValidasi(?User $user): bool
    {
        return $user !== null && in_array((int) $user->role_id, self::ROLE_VALIDASI, true);
    }

    /** Pengaju, koordinator, atau peserta itu sendiri; hanya saat SPJ Disetujui. */
    public function bolehUnggah(User $user, Spj $spj, SpjPeserta $peserta): bool
    {
        if ($spj->status !== Spj::STATUS_DISETUJUI || (int) $peserta->spj_id !== (int) $spj->id) {
            return false;
        }
        $karyawanId = $user->karyawan?->id;

        return (int) $spj->dibuat_oleh === (int) $user->id
            || ($karyawanId !== null && (int) $spj->koordinator_karyawan_id === (int) $karyawanId)
            || ($karyawanId !== null && (int) $peserta->karyawan_id === (int) $karyawanId);
    }

    /** Nota Menunggu boleh dihapus oleh pengunggahnya atau pengaju SPJ. */
    public function bolehHapus(User $user, SpjBiaya $biaya): bool
    {
        $spj = $biaya->peserta->spj;

        return $biaya->status === SpjBiaya::MENUNGGU
            && $spj->status === Spj::STATUS_DISETUJUI
            && ((int) $biaya->diunggah_oleh === (int) $user->id || (int) $spj->dibuat_oleh === (int) $user->id);
    }

    /** Total penginapan yang sudah divalidasi (dibayar) untuk satu peserta. */
    public function penginapanTerpakai(SpjPeserta $peserta, ?int $kecualiBiayaId = null): float
    {
        return (float) SpjBiaya::where('spj_peserta_id', $peserta->id)
            ->where('jenis', SpjBiaya::PENGINAPAN)
            ->where('status', SpjBiaya::DIVALIDASI)
            ->when($kecualiBiayaId, fn ($q) => $q->whereKeyNot($kecualiBiayaId))
            ->sum('nominal_dibayar');
    }

    /**
     * Pratinjau nominal dibayar untuk nota yang akan divalidasi.
     *
     * @return array{dibayar: float|null, batas: float|null, sisa: float|null, manual: bool}
     */
    public function pratinjau(SpjBiaya $biaya): array
    {
        $peserta = $biaya->peserta;
        $nota = (float) $biaya->nominal_nota;

        if ($biaya->jenis !== SpjBiaya::PENGINAPAN) {
            return ['dibayar' => $nota, 'batas' => null, 'sisa' => null, 'manual' => false];
        }
        if ($peserta->batas_penginapan === null) {
            return ['dibayar' => null, 'batas' => null, 'sisa' => null, 'manual' => true];
        }
        $batas = (float) $peserta->batas_penginapan;
        $sisa = max(0.0, $batas - $this->penginapanTerpakai($peserta, $biaya->id));

        return ['dibayar' => min($nota, $sisa), 'batas' => $batas, 'sisa' => $sisa, 'manual' => false];
    }

    /**
     * Validasi nota (Finance). $nominalManual wajib hanya untuk penginapan di provinsi tanpa tarif.
     *
     * @throws \DomainException bila status/aturan tidak terpenuhi
     */
    public function validasi(SpjBiaya $biaya, User $oleh, ?float $nominalManual = null, ?string $catatan = null): SpjBiaya
    {
        return DB::transaction(function () use ($biaya, $oleh, $nominalManual, $catatan) {
            // Kunci semua nota peserta ini agar dua validasi bersamaan tidak melampaui batas penginapan
            SpjBiaya::where('spj_peserta_id', $biaya->spj_peserta_id)->lockForUpdate()->get();
            $biaya = SpjBiaya::with('peserta.spj')->findOrFail($biaya->id);
            $spj = $biaya->peserta->spj;

            if ($spj->status !== Spj::STATUS_DISETUJUI) {
                throw new \DomainException("Nota tidak dapat divalidasi: SPJ berstatus {$spj->status}.");
            }
            if ($biaya->status !== SpjBiaya::MENUNGGU) {
                throw new \DomainException("Nota ini sudah berstatus {$biaya->status}.");
            }

            $p = $this->pratinjau($biaya);
            $nota = (float) $biaya->nominal_nota;
            if ($p['manual']) {
                if ($nominalManual === null) {
                    throw new \DomainException('Provinsi ini belum punya tarif penginapan: isi nominal dibayar secara manual.');
                }
                if ($nominalManual < 0 || $nominalManual > $nota) {
                    throw new \DomainException('Nominal dibayar harus antara 0 dan nominal nota.');
                }
                $dibayar = $nominalManual;
            } else {
                $dibayar = (float) $p['dibayar'];
            }

            $biaya->update([
                'status' => SpjBiaya::DIVALIDASI,
                'nominal_dibayar' => round($dibayar, 2),
                'divalidasi_oleh' => $oleh->id,
                'divalidasi_pada' => now(),
                'catatan' => $catatan ?: ($dibayar < $nota
                    ? 'Melebihi batas penginapan; kelebihan Rp '.number_format($nota - $dibayar, 0, ',', '.').' ditanggung peserta.'
                    : null),
            ]);

            $this->catatSelisih($biaya, $spj);

            return $biaya->fresh();
        }, 3);
    }

    public function tolak(SpjBiaya $biaya, User $oleh, string $alasan): SpjBiaya
    {
        return DB::transaction(function () use ($biaya, $oleh, $alasan) {
            $biaya = SpjBiaya::with('peserta.spj')->lockForUpdate()->findOrFail($biaya->id);
            if ($biaya->status !== SpjBiaya::MENUNGGU) {
                throw new \DomainException("Nota ini sudah berstatus {$biaya->status}.");
            }
            if ($biaya->peserta->spj->status !== Spj::STATUS_DISETUJUI) {
                throw new \DomainException("Nota tidak dapat diproses: SPJ berstatus {$biaya->peserta->spj->status}.");
            }
            $biaya->update([
                'status' => SpjBiaya::DITOLAK, 'nominal_dibayar' => null, 'divalidasi_oleh' => $oleh->id,
                'divalidasi_pada' => now(), 'catatan' => $alasan,
            ]);

            return $biaya->fresh();
        });
    }

    /** Catat selisih nota penginapan vs tarif per malam (hanya bila tarif ada dan nilainya berbeda). */
    private function catatSelisih(SpjBiaya $biaya, Spj $spj): void
    {
        $peserta = $biaya->peserta;
        if ($biaya->jenis !== SpjBiaya::PENGINAPAN || $peserta->tarif_penginapan === null || (float) $peserta->tarif_penginapan <= 0) {
            return;
        }
        $malam = max(1, (int) ($biaya->jumlah_malam ?: $spj->jumlah_malam));
        $notaPerMalam = round((float) $biaya->nominal_nota / $malam, 2);
        $tarif = (float) $peserta->tarif_penginapan;
        $selisih = round($notaPerMalam - $tarif, 2);
        if ($selisih == 0.0) {
            return;
        }

        SpjSelisihPenginapan::updateOrCreate(['spj_biaya_id' => $biaya->id], [
            'spj_id' => $spj->id,
            'provinsi' => $spj->provinsi,
            'kategori_tarif' => $peserta->kategori_tarif,
            'jumlah_malam' => $malam,
            'nota_per_malam' => $notaPerMalam,
            'tarif_per_malam' => $tarif,
            'selisih_per_malam' => $selisih,
            'persen' => round($selisih / $tarif * 100, 2),
            'tingkat' => $selisih > 0 ? SpjSelisihPenginapan::PERINGATAN : SpjSelisihPenginapan::INFO,
        ]);
    }

    /**
     * Baris AKOMODASI untuk PDF dari nota yang SUDAH divalidasi, urut peserta lalu tanggal.
     *
     * @return array<int, array{perincian: string, tgl: string, harian: float|null, total: float, ket: string}>
     */
    public function barisAkomodasiPdf(Spj $spj, ?User $viewer): array
    {
        $spj->loadMissing('pesertas');
        $biayas = SpjBiaya::whereIn('spj_peserta_id', $spj->pesertas->pluck('id'))
            ->where('status', SpjBiaya::DIVALIDASI)
            ->get()
            ->groupBy('spj_peserta_id');

        $baris = [];
        foreach ($spj->pesertas as $p) {
            foreach (($biayas[$p->id] ?? collect())->sortBy([['tanggal', 'asc'], ['id', 'asc']]) as $b) {
                $malam = $b->jenis === SpjBiaya::PENGINAPAN ? (int) ($b->jumlah_malam ?: $spj->jumlah_malam) : null;
                $baris[] = [
                    'perincian' => $b->labelJenis().' '.$p->nama
                        .($malam ? " ({$malam} malam)" : '')
                        .($b->keterangan ? ' - '.$b->keterangan : ''),
                    'tgl' => Carbon::parse($b->tanggal)->locale('id')->translatedFormat('j M Y'),
                    'harian' => $malam ? round((float) $b->nominal_dibayar / $malam, 2) : null,
                    'total' => (float) $b->nominal_dibayar,
                    'ket' => 'Reimburse // '.(RekeningSpj::untuk($viewer, $p->rekening_encrypted, $p->karyawan_id) ?? 'rekening belum diisi')
                        .' ('.$p->nama.')',
                ];
            }
        }

        return $baris;
    }
}
