<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class MasterDataSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();

        // 1. Suntik Data Departemen (Dilengkapi kode_departemen)
        DB::table('departemens')->insert([
            ['kode_departemen' => 'IT', 'nama_departemen' => 'Information Technology (IT)', 'created_at' => $now, 'updated_at' => $now],
            ['kode_departemen' => 'HRD', 'nama_departemen' => 'Human Resources (HR)', 'created_at' => $now, 'updated_at' => $now],
            ['kode_departemen' => 'FIN', 'nama_departemen' => 'Finance & Accounting', 'created_at' => $now, 'updated_at' => $now],
        ]);

        // 2. Suntik Data Jabatan (Sudah memiliki kode_jabatan)
        DB::table('jabatans')->insert([
            ['kode_jabatan' => 'MGR', 'nama_jabatan' => 'Manager', 'created_at' => $now, 'updated_at' => $now],
            ['kode_jabatan' => 'SPV', 'nama_jabatan' => 'Supervisor', 'created_at' => $now, 'updated_at' => $now],
            ['kode_jabatan' => 'STF', 'nama_jabatan' => 'Staff Pelaksana', 'created_at' => $now, 'updated_at' => $now],
        ]);

        // 3. Suntik Data Golongan (Sudah memiliki kode_golongan & gaji_pokok)
        DB::table('golongans')->insert([
            ['kode_golongan' => 'GOL-3A', 'nama_golongan' => 'Senior Management', 'gaji_pokok' => 12000000, 'created_at' => $now, 'updated_at' => $now],
            ['kode_golongan' => 'GOL-2A', 'nama_golongan' => 'Middle Management', 'gaji_pokok' => 8000000, 'created_at' => $now, 'updated_at' => $now],
            ['kode_golongan' => 'GOL-1A', 'nama_golongan' => 'Junior Staff', 'gaji_pokok' => 4500000, 'created_at' => $now, 'updated_at' => $now],
        ]);
    }
}