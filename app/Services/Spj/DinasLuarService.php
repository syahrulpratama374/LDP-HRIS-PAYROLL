<?php

namespace App\Services\Spj;

use App\Models\PengajuanSpj;
use App\Models\Spj;
use App\Models\SpjPeserta;
use Carbon\Carbon;

/**
 * Satu sumber kebenaran "karyawan sedang Dinas Luar (SPJ aktif)" pada suatu tanggal,
 * menggabungkan SPJ model lama (pengajuan_spjs, per karyawan) dan SPJ model baru
 * (spjs + spj_pesertas, semua peserta).
 *
 * Dipakai untuk: monitor absensi HC, bypass radius geofence saat presensi, dan
 * Dinas Luar otomatis di ldp:daily-automation (pengganti Alpha).
 */
class DinasLuarService
{
    /** Status SPJ baru yang dianggap aktif (perjalanan sudah disetujui penuh). */
    public const STATUS_SPJ_BARU_AKTIF = [Spj::STATUS_DISETUJUI, Spj::STATUS_SELESAI];

    /**
     * ID karyawan yang sedang SPJ aktif pada tanggal tertentu (unik, tanpa urutan tertentu).
     *
     * @return int[]
     */
    public function karyawanIdsAktifPada($tanggal, ?int $karyawanId = null): array
    {
        $tanggal = Carbon::parse($tanggal)->toDateString();

        $lama = PengajuanSpj::aktifPada($tanggal)
            ->when($karyawanId, fn ($q) => $q->where('karyawan_id', $karyawanId))
            ->pluck('karyawan_id');

        $baru = SpjPeserta::query()
            ->whereHas('spj', fn ($q) => $q->whereIn('status', self::STATUS_SPJ_BARU_AKTIF)
                ->whereDate('tgl_berangkat', '<=', $tanggal)
                ->whereDate('tgl_pulang', '>=', $tanggal))
            ->when($karyawanId, fn ($q) => $q->where('karyawan_id', $karyawanId))
            ->pluck('karyawan_id');

        return $lama->merge($baru)->map(fn ($id) => (int) $id)->unique()->values()->all();
    }

    /** Apakah satu karyawan sedang SPJ aktif (lama atau baru) pada tanggal tertentu. */
    public function sedangDinasLuar(int $karyawanId, $tanggal): bool
    {
        return $this->karyawanIdsAktifPada($tanggal, $karyawanId) !== [];
    }
}
