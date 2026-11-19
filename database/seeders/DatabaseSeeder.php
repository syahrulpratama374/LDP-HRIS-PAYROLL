<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

/**
 * Seeder utama: `php artisan migrate:fresh --seed` atau `php artisan db:seed` sudah cukup,
 * tidak perlu lagi menjalankan `--class=...` terpisah (termasuk MenuSeeder).
 * Seluruh seeder di bawah idempoten, sehingga aman dijalankan berulang kali.
 * Urutan mengikuti dependensi foreign key.
 */
class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $this->call([
            // 1. Role dasar (ID 1–6 dipakai hard-coded di controller & MenuSeeder)
            UserRoleSeeder::class,

            // 2. Master data HRIS: departemen legacy, jabatan + tunjangan, golongan + gaji pokok
            MasterDataSeeder::class,

            // 3. Master keuangan & pajak + parameter sistem
            MasterPtkpSeeder::class,
            MasterTarifTerSeeder::class,
            MasterKomponenPayrollSeeder::class,
            PengaturanSeeder::class,

            // 4. Master cuti & template persuratan
            MasterJenisCutiSeeder::class,
            MasterTemplateSuratSeeder::class,

            // 5. Struktur Organisasi LDP 2026: 9 departemen, 35 akun + profil karyawan, gaji aktif, shift OPM
            LdpStrukturSeeder::class,

            // 5b. Unit penerbit surat ("Yang Mengeluarkan"), butuh departemen dari LdpStrukturSeeder
            UnitPenerbitSuratSeeder::class,

            // 6. Super Admin (syahrul.admin) & akun uji lama — hanya menyentuh email miliknya sendiri,
            //    dijalankan setelah struktur sehingga tidak menimpa 35 akun LDP 2026
            UserSeeder::class,

            // 7. Menu sidebar & hak akses per role (role_has_menus) — dibangun ulang tiap kali dijalankan
            MenuSeeder::class,
        ]);
    }
}
