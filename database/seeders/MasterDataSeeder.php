<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Master data dasar (idempoten — aman dijalankan berulang):
 * departemen legacy, jenjang jabatan + tunjangan jabatan, dan golongan + gaji pokok.
 * Struktur organisasi LDP 2026 (departemen riil & karyawan) ada di LdpStrukturSeeder.
 */
class MasterDataSeeder extends Seeder
{
    /** Jenjang jabatan => [nama, tunjangan jabatan per bulan] */
    public const JABATAN = [
        'CEO' => ['Chief Executive Officer', 10000000],
        'MD' => ['Managing Director', 7500000],
        'MGR' => ['Manager / Head', 3500000],
        'WKM' => ['Wakil Manager', 2500000],
        'SPV' => ['Supervisor', 1500000],
        'STF' => ['Staff Pelaksana', 0],
    ];

    /** Kode golongan => [nama, gaji pokok] */
    public const GOLONGAN = [
        'GOL-4A' => ['Direksi', 25000000],
        'GOL-3A' => ['Senior Management', 12000000],
        'GOL-2A' => ['Middle Management', 8000000],
        'GOL-1A' => ['Junior Staff', 4500000],
    ];

    public function run(): void
    {
        $now = now();

        // 1. Departemen legacy (departemen riil LDP 2026 dibuat di LdpStrukturSeeder)
        foreach ([
            'IT' => 'Information Technology (IT)',
            'HRD' => 'Human Resources (HR)',
            'FIN' => 'Finance & Accounting',
        ] as $kode => $nama) {
            $this->upsert('departemens', ['kode_departemen' => $kode], ['nama_departemen' => $nama], $now);
        }

        // 2. Jenjang jabatan + tunjangan jabatan (dibaca PayrollCalculator sebagai baris "Tunjangan Jabatan")
        $adaTunjangan = Schema::hasColumn('jabatans', 'tunjangan');
        foreach (self::JABATAN as $kode => [$nama, $tunjangan]) {
            $nilai = ['nama_jabatan' => $nama] + ($adaTunjangan ? ['tunjangan' => $tunjangan] : []);
            $this->upsert('jabatans', ['kode_jabatan' => $kode], $nilai, $now);
        }

        // 3. Golongan + gaji pokok
        foreach (self::GOLONGAN as $kode => [$nama, $gaji]) {
            $this->upsert('golongans', ['kode_golongan' => $kode], ['nama_golongan' => $nama, 'gaji_pokok' => $gaji], $now);
        }
    }

    private function upsert(string $tabel, array $kunci, array $nilai, $now): void
    {
        if (DB::table($tabel)->where($kunci)->exists()) {
            DB::table($tabel)->where($kunci)->update($nilai + ['updated_at' => $now]);
        } else {
            DB::table($tabel)->insert($kunci + $nilai + ['created_at' => $now, 'updated_at' => $now]);
        }
    }
}
