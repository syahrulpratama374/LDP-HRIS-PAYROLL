<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $this->call([
            // 1. Buat Role Dasar
            UserRoleSeeder::class,
            
            // 2. Eksekusi SEMUA Master Data Terlebih Dahulu
            MasterDataSeeder::class,
            MasterPtkpSeeder::class,
            MasterKomponenPayrollSeeder::class,
            MasterTemplateSuratSeeder::class,
            PengaturanSeeder::class,

            // 3. Setelah Master Data siap, barulah User & Profil Karyawan dibuat
            // UserSeeder akan otomatis memakai Master Data yang sudah terbuat di atas
            UserSeeder::class,
        ]);
    }
}