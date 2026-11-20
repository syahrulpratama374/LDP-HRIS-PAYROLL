<?php

namespace App\Services\Spj;

use App\Models\Spj;
use App\Models\SpjBiaya;
use App\Models\SpjSelisihPenginapan;
use Illuminate\Support\Facades\DB;

/** Rekap selisih nota penginapan vs tarif (halaman rekap per provinsi & panel dashboard HC/Finance). */
class RekapSelisihSpjService
{
    /** Role yang melihat rekap & panel: Admin, HC, Finance. */
    public const ROLE_LIHAT = [1, 3, 4];

    /**
     * Rekap per provinsi untuk satu tahun (berdasarkan waktu nota divalidasi/dicatat).
     *
     * @return array<int, array<string, mixed>>
     */
    public function perProvinsi(int $tahun): array
    {
        return SpjSelisihPenginapan::query()
            ->whereYear('created_at', $tahun)
            ->select('provinsi')
            ->selectRaw('COUNT(*) as kejadian')
            ->selectRaw("SUM(CASE WHEN tingkat = 'peringatan' THEN 1 ELSE 0 END) as peringatan")
            ->selectRaw("SUM(CASE WHEN tingkat = 'info' THEN 1 ELSE 0 END) as info")
            ->selectRaw('AVG(nota_per_malam) as rata_nota')
            ->selectRaw('AVG(tarif_per_malam) as rata_tarif')
            ->selectRaw('AVG(persen) as rata_persen')
            ->selectRaw('MAX(persen) as maks_persen')
            ->groupBy('provinsi')
            ->orderByDesc(DB::raw('AVG(persen)'))
            ->get()
            ->map(fn ($r) => [
                'provinsi' => $r->provinsi,
                'kejadian' => (int) $r->kejadian,
                'peringatan' => (int) $r->peringatan,
                'info' => (int) $r->info,
                'rata_nota' => round((float) $r->rata_nota, 2),
                'rata_tarif' => round((float) $r->rata_tarif, 2),
                'rata_selisih' => round((float) $r->rata_nota - (float) $r->rata_tarif, 2),
                'rata_persen' => round((float) $r->rata_persen, 2),
                'maks_persen' => round((float) $r->maks_persen, 2),
            ])->values()->all();
    }

    /**
     * Daftar kejadian (terbaru dulu) untuk tabel rincian.
     *
     * @return array<int, array<string, mixed>>
     */
    public function kejadian(int $tahun, ?string $provinsi = null, ?string $tingkat = null, int $batas = 100): array
    {
        return SpjSelisihPenginapan::with(['spj:id,nomor_surat', 'biaya:id,spj_peserta_id,tanggal', 'biaya.peserta:id,nama'])
            ->whereYear('created_at', $tahun)
            ->when($provinsi, fn ($q) => $q->where('provinsi', $provinsi))
            ->when($tingkat, fn ($q) => $q->where('tingkat', $tingkat))
            ->latest('id')
            ->limit($batas)
            ->get()
            ->map(fn (SpjSelisihPenginapan $s) => $this->baris($s))
            ->values()->all();
    }

    /** Data panel dashboard HC & Finance. */
    public function panelDashboard(int $tahun): array
    {
        $peringatanTerbaru = SpjSelisihPenginapan::with(['spj:id,nomor_surat', 'biaya:id,spj_peserta_id,tanggal', 'biaya.peserta:id,nama'])
            ->where('tingkat', SpjSelisihPenginapan::PERINGATAN)
            ->latest('id')->limit(5)->get()
            ->map(fn (SpjSelisihPenginapan $s) => $this->baris($s))->values();

        $tahunIni = SpjSelisihPenginapan::whereYear('created_at', $tahun);

        return [
            'notaMenunggu' => SpjBiaya::where('status', SpjBiaya::MENUNGGU)
                ->whereHas('peserta.spj', fn ($q) => $q->where('status', Spj::STATUS_DISETUJUI))->count(),
            'peringatanTahunIni' => (clone $tahunIni)->where('tingkat', SpjSelisihPenginapan::PERINGATAN)->count(),
            'infoTahunIni' => (clone $tahunIni)->where('tingkat', SpjSelisihPenginapan::INFO)->count(),
            'peringatanTerbaru' => $peringatanTerbaru,
            'tahun' => $tahun,
        ];
    }

    private function baris(SpjSelisihPenginapan $s): array
    {
        return [
            'id' => $s->id,
            'spj_id' => $s->spj_id,
            'nomor_surat' => $s->spj?->nomor_surat,
            'peserta' => $s->biaya?->peserta?->nama,
            'tanggal' => $s->biaya?->tanggal,
            'provinsi' => $s->provinsi,
            'kategori_tarif' => $s->kategori_tarif,
            'jumlah_malam' => $s->jumlah_malam,
            'nota_per_malam' => (float) $s->nota_per_malam,
            'tarif_per_malam' => (float) $s->tarif_per_malam,
            'selisih_per_malam' => (float) $s->selisih_per_malam,
            'persen' => (float) $s->persen,
            'tingkat' => $s->tingkat,
            'dicatat' => $s->created_at?->toDateTimeString(),
        ];
    }
}
