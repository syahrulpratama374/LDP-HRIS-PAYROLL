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
            ['kode_ptkp' => 'TK/2', 'nominal_neto_tahunan' => 63000000, 'deskripsi' => 'Tidak Kawin, 2 Tanggungan', 'created_at' => $now, 'updated_at' => $now],
            ['kode_ptkp' => 'TK/3', 'nominal_neto_tahunan' => 67500000, 'deskripsi' => 'Tidak Kawin, 3 Tanggungan', 'created_at' => $now, 'updated_at' => $now],
        ];

        // Kategori TER menurut PP 58/2023: A = TK/0, TK/1, K/0; B = TK/2, TK/3, K/1, K/2; C = K/3
        $kategori = ['TK/0' => 'A', 'TK/1' => 'A', 'K/0' => 'A', 'TK/2' => 'B', 'TK/3' => 'B', 'K/1' => 'B', 'K/2' => 'B', 'K/3' => 'C'];

        foreach ($ptkps as $ptkp) {
            $ptkp['kategori_ter'] = $kategori[$ptkp['kode_ptkp']];
            $ada = DB::table('master_ptkps')->where('kode_ptkp', $ptkp['kode_ptkp'])->exists();
            if ($ada) {
                DB::table('master_ptkps')->where('kode_ptkp', $ptkp['kode_ptkp'])
                    ->update(['kategori_ter' => $ptkp['kategori_ter']]);
            } else {
                DB::table('master_ptkps')->insert($ptkp);
            }
        }
    }
}