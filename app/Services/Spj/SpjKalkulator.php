<?php

namespace App\Services\Spj;

use App\Models\Karyawan;
use App\Models\MasterTarifSpj;
use App\Support\Terbilang;
use Carbon\Carbon;
use Illuminate\Support\Collection;

/**
 * Perhitungan SPJ (satu sumber kebenaran untuk form, simpan, dan PDF):
 * - hari  = tanggal pulang - tanggal berangkat + 1; malam = hari - 1
 * - uang harian per peserta = tarif uang harian (provinsi x kategori) x hari (tetap, tanpa nota)
 * - batas penginapan per peserta = tarif penginapan (provinsi x kategori) x malam (info; reimburse
 *   dibayar min(nota, batas) di tahap nota)
 * Kategori SELALU dibaca dari karyawans.kategori_tarif_spj, bukan dari jenjang jabatan.
 */
class SpjKalkulator
{
    /**
     * @param  iterable<Karyawan>  $karyawans  urutan dipertahankan
     */
    public function hitung(string $provinsi, $tglBerangkat, $tglPulang, iterable $karyawans): array
    {
        $berangkat = Carbon::parse($tglBerangkat)->startOfDay();
        $pulang = Carbon::parse($tglPulang)->startOfDay();
        $hari = $pulang->lt($berangkat) ? 0 : (int) $berangkat->diffInDays($pulang) + 1;
        $malam = max($hari - 1, 0);

        $peringatan = [];
        $peserta = collect($karyawans)->values()->map(function (Karyawan $k) use ($provinsi, $berangkat, $hari, $malam, &$peringatan) {
            $kategori = $k->kategori_tarif_spj ?: 'Staff';
            $uh = MasterTarifSpj::tarifBerlaku($provinsi, MasterTarifSpj::JENIS_UANG_HARIAN, $kategori, $berangkat);
            $inap = MasterTarifSpj::tarifBerlaku($provinsi, MasterTarifSpj::JENIS_PENGINAPAN, $kategori, $berangkat);

            if (! $uh) {
                $peringatan[] = "Tarif uang harian {$provinsi} kategori {$kategori} belum ada untuk tanggal berangkat ({$k->nama_lengkap}).";
            }

            $tarifUh = $uh ? (float) $uh->nominal : null;
            $tarifInap = $inap ? (float) $inap->nominal : null;

            return [
                'karyawan_id' => $k->id,
                'nama' => $k->nama_lengkap,
                'posisi' => $k->nama_posisi ?: $k->jabatan?->nama_jabatan,
                'departemen' => $k->departemen?->nama_departemen,
                'kategori_tarif' => $kategori,
                'tarif_uang_harian' => $tarifUh,
                'total_uang_harian' => $tarifUh === null ? 0.0 : $tarifUh * $hari,
                'tarif_penginapan' => $tarifInap,
                'batas_penginapan' => $tarifInap === null ? null : $tarifInap * $malam,
            ];
        });

        $total = (float) $peserta->sum('total_uang_harian');

        return [
            'hari' => $hari,
            'malam' => $malam,
            'peserta' => $peserta->all(),
            'total_uang_harian' => $total,
            'terbilang' => Terbilang::rupiah($total),
            'peringatan' => $peringatan,
        ];
    }

    /** Karyawan aktif sesuai urutan id yang diberikan, dengan relasi yang dibutuhkan kalkulator. */
    public function muatKaryawan(array $ids): Collection
    {
        $data = Karyawan::with(['jabatan:id,nama_jabatan', 'departemen:id,nama_departemen,kode_departemen'])
            ->whereIn('id', $ids)->get()->keyBy('id');

        return collect($ids)->map(fn ($id) => $data->get((int) $id))->filter()->values();
    }
}
