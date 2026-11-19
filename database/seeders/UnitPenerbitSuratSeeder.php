<?php

namespace Database\Seeders;

use App\Models\Departemen;
use App\Models\UnitPenerbitSurat;
use Illuminate\Database\Seeder;

/**
 * Master unit "Yang Mengeluarkan" surat. Jalankan setelah LdpStrukturSeeder (butuh departemen).
 *
 * Aman diulang: hanya MEMBUAT unit yang belum ada (kunci: kode). Unit yang sudah ada tidak diubah
 * sama sekali, jadi perubahan manual di DB tidak tertimpa.
 * Departemen INF, CRE, BRO, SLS (dan departemen lama IT, HRD) sengaja tidak dipetakan:
 * pembuat dari departemen itu memilih penerbit secara manual.
 */
class UnitPenerbitSuratSeeder extends Seeder
{
    /** kode => [nama, kode_departemen default atau null] */
    public const UNITS = [
        'LDP-DIR' => ['Direksi', 'BOD'],
        'LDP-HC' => ['Human Capital', 'HC'],
        'LDP-FIN' => ['Finance', 'FIN'],
        'LDP-OPM' => ['Operation & Maintenance', 'OPM'],
        'LDP-GP' => ['Government & Partnership', 'GOV'],
        'LDP-IPR' => ['Iprime', null],
        'LDP-CORP' => ['Corporate', null],
    ];

    public function run(): void
    {
        foreach (self::UNITS as $kode => [$nama, $kodeDepartemen]) {
            if (UnitPenerbitSurat::where('kode', $kode)->exists()) {
                continue;
            }

            $departemenId = $kodeDepartemen
                ? Departemen::where('kode_departemen', $kodeDepartemen)->value('id')
                : null;

            if ($kodeDepartemen && ! $departemenId) {
                $this->command?->warn("Unit {$kode}: departemen {$kodeDepartemen} belum ada, dibuat tanpa pemetaan departemen.");
            }
            if ($departemenId && UnitPenerbitSurat::where('departemen_id', $departemenId)->exists()) {
                $this->command?->warn("Unit {$kode}: departemen {$kodeDepartemen} sudah dipetakan ke unit lain, dibuat tanpa pemetaan.");
                $departemenId = null;
            }

            UnitPenerbitSurat::create([
                'kode' => $kode,
                'nama' => $nama,
                'departemen_id' => $departemenId,
                'is_active' => true,
            ]);
        }
    }
}
