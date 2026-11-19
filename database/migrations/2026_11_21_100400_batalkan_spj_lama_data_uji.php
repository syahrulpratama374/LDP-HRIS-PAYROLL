<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Data: batalkan dua SPJ model lama milik staff.hc1 yang merupakan data uji, supaya SPJ
 * berstatus 'Selesai' tidak ikut dicairkan di payroll November (PayrollCalculator mengambil
 * SPJ 'Selesai' yang belum dibayar). Memakai status 'Ditolak' yang sudah ada di model lama.
 *
 * Baris dicocokkan ketat (id, pemilik, tanggal, total, status awal, belum dibayar, belum tertaut
 * payroll) agar tidak menyentuh SPJ lain di DB berbeda. Bisa dibalik ke status awal.
 */
return new class extends Migration
{
    private const PEMILIK = 'staff.hc1';

    /** id => [tgl_mulai, total_biaya, status_awal] */
    private const SPJ = [
        1 => ['2026-11-18', 500000, 'Selesai'],
        2 => ['2026-11-19', 400000, 'Pending'],
    ];

    public function up(): void
    {
        foreach (self::SPJ as $id => [$tglMulai, $total, $statusAwal]) {
            $this->baris($id, $tglMulai, $total)
                ->where('status_approval', $statusAwal)
                ->where('sudah_dibayar', false)
                ->whereNull('payroll_id')
                ->update(['status_approval' => 'Ditolak', 'updated_at' => now()]);
        }
    }

    public function down(): void
    {
        foreach (self::SPJ as $id => [$tglMulai, $total, $statusAwal]) {
            $this->baris($id, $tglMulai, $total)
                ->where('status_approval', 'Ditolak')
                ->update(['status_approval' => $statusAwal, 'updated_at' => now()]);
        }
    }

    private function baris(int $id, string $tglMulai, int $total)
    {
        $karyawanId = DB::table('karyawans')
            ->join('users', 'users.id', '=', 'karyawans.user_id')
            ->where('users.username', self::PEMILIK)
            ->value('karyawans.id');

        return DB::table('pengajuan_spjs')
            ->where('id', $id)
            ->where('karyawan_id', $karyawanId ?? 0)
            ->whereDate('tgl_mulai', $tglMulai)
            ->where('total_biaya', $total);
    }
};
