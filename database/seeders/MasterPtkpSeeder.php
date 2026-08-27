<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class MasterPtkpSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();

        $ptkps = [
            ['kode_ptkp' => 'TK/0', 'nominal_neto_tahunan' => 54000000, 'deskripsi' => 'Tidak Kawin, Tanpa Tanggungan', 'created_at' => $now, 'updated_at' => $now],
            ['kode_ptkp' => 'TK/1', 'nominal_neto_tahunan' => 58500000, 'deskripsi' => 'Tidak Kawin, 1 Tanggungan', 'created_at' => $now, 'updated_at' => $now],
            ['kode_ptkp' => 'K/0',  'nominal_neto_tahunan' => 58500000, 'deskripsi' => 'Kawin, Tanpa Tanggungan', 'created_at' => $now, 'updated_at' => $now],
            ['kode_ptkp' => 'K/1',  'nominal_neto_tahunan' => 63000000, 'deskripsi' => 'Kawin, 1 Tanggungan', 'created_at' => $now, 'updated_at' => $now],
            ['kode_ptkp' => 'K/2',  'nominal_neto_tahunan' => 67500000, 'deskripsi' => 'Kawin, 2 Tanggungan', 'created_at' => $now, 'updated_at' => $now],
            ['kode_ptkp' => 'K/3',  'nominal_neto_tahunan' => 72000000, 'deskripsi' => 'Kawin, 3 Tanggungan', 'created_at' => $now, 'updated_at' => $now],
        ];
        
        DB::table('master_ptkps')->insert($ptkps);
    }
}