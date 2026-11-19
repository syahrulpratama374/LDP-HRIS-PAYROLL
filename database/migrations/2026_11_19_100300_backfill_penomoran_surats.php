<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Backfill register & penghitung nomor dari surat_keluars yang sudah bernomor.
 * Data-only dan idempoten (aman dijalankan ulang). Sengaja tidak memakai class aplikasi
 * agar migrasi tetap jalan walau service berubah di kemudian hari.
 *
 * Format nomor lama: {urut}/{KODE_JENIS}/{KODE_PENERBIT}/{BULAN_ROMAWI}/{TAHUN}.
 * Nomor yang tidak cocok format dilewati.
 */
return new class extends Migration
{
    public function up(): void
    {
        $mode = DB::table('pengaturans')->where('kunci', 'penomoran_surat_mode')->value('nilai');
        $mode = in_array($mode, ['global', 'per_jenis', 'per_penerbit'], true) ? $mode : 'global';

        $maks = [];

        $surats = DB::table('surat_keluars')->whereNotNull('nomor_surat')
            ->select('id', 'nomor_surat', 'tanggal_terbit')->orderBy('id')->get();

        foreach ($surats as $s) {
            $p = explode('/', trim($s->nomor_surat));
            $n = count($p);
            if ($n < 5 || ! ctype_digit($p[0]) || ! preg_match('/^\d{4}$/', $p[$n - 1])) {
                continue;
            }

            $urut = (int) $p[0];
            $tahun = (int) $p[$n - 1];
            $penerbit = strtoupper($p[$n - 3]);
            $jenis = strtoupper(implode('/', array_slice($p, 1, $n - 4)));

            DB::table('nomor_surat_terbits')->insertOrIgnore([
                'nomor' => $s->nomor_surat,
                'tahun' => $tahun,
                'urut' => $urut,
                'kode_jenis' => $jenis,
                'kode_penerbit' => $penerbit,
                'sumber_type' => 'App\\Models\\SuratKeluar',
                'sumber_id' => $s->id,
                'diterbitkan_pada' => $s->tanggal_terbit,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $kunci = match ($mode) {
                'per_jenis' => "{$tahun}|{$jenis}",
                'per_penerbit' => "{$tahun}|{$penerbit}",
                default => (string) $tahun,
            };
            $maks[$kunci] = max($maks[$kunci] ?? 0, $urut);
        }

        foreach ($maks as $kunci => $urut) {
            $ada = DB::table('penomoran_surats')->where('kunci', $kunci)->value('nomor_terakhir');
            if ($ada === null) {
                DB::table('penomoran_surats')->insert([
                    'kunci' => $kunci, 'nomor_terakhir' => $urut,
                    'created_at' => now(), 'updated_at' => now(),
                ]);
            } elseif ($ada < $urut) {
                DB::table('penomoran_surats')->where('kunci', $kunci)
                    ->update(['nomor_terakhir' => $urut, 'updated_at' => now()]);
            }
        }
    }

    public function down(): void
    {
        // Tabel dihapus oleh migrasi create_penomoran_surats; tidak ada yang perlu dibalik di sini.
    }
};
