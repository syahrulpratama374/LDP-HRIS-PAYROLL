<?php

namespace Database\Seeders;

use App\Models\MasterTarifSpj;
use Illuminate\Database\Seeder;

/**
 * Master tarif SPJ dari tabel perusahaan (satuan OH). Urutan nilai: Staff / Manager / Direksi.
 *
 * Aman diulang dan TIDAK menimpa: baris (provinsi, jenis, kategori, berlaku_mulai) yang sudah ada
 * tidak diubah, jadi nominal yang sudah dikoreksi HC tetap. Hanya baris yang belum ada yang dibuat.
 *
 * Daftar BELUM LENGKAP: hanya baris yang terbaca di tabel sumber. NTB dan NTT baru punya tarif
 * penginapan; provinsi Kalimantan, Sulawesi, Gorontalo, Maluku, dan Papua belum ada. Lengkapi lewat menu.
 */
class MasterTarifSpjSeeder extends Seeder
{
    public const BERLAKU_MULAI = '2026-01-01';

    public const UANG_HARIAN = [
        'Aceh' => [144000, 180000, 360000],
        'Sumatera Utara' => [148000, 185000, 370000],
        'Riau' => [144000, 180000, 360000],
        'Kepulauan Riau' => [148000, 185000, 370000],
        'Jambi' => [148000, 185000, 370000],
        'Sumatera Barat' => [144000, 180000, 360000],
        'Sumatera Selatan' => [144000, 180000, 360000],
        'Lampung' => [152000, 190000, 380000],
        'Bengkulu' => [148000, 185000, 370000],
        'Bangka Belitung' => [148000, 185000, 370000],
        'Banten' => [144000, 180000, 360000],
        'Jawa Barat' => [172000, 215000, 430000],
        'DKI Jakarta' => [212000, 265000, 530000],
        'Jawa Tengah' => [148000, 185000, 370000],
        'DI Yogyakarta' => [168000, 210000, 420000],
        'Jawa Timur' => [164000, 205000, 410000],
        'Bali' => [192000, 240000, 480000],
    ];

    public const PENGINAPAN = [
        'Aceh' => [238000, 340000, 510000],
        'Sumatera Utara' => [217000, 310000, 465000],
        'Riau' => [266000, 380000, 570000],
        'Kepulauan Riau' => [196000, 280000, 420000],
        'Jambi' => [203000, 290000, 435000],
        'Sumatera Barat' => [235200, 336000, 504000],
        'Sumatera Selatan' => [196000, 280000, 420000],
        'Lampung' => [249200, 356000, 534000],
        'Bengkulu' => [357000, 510000, 765000],
        'Bangka Belitung' => [217000, 310000, 465000],
        'Banten' => [262500, 375000, 562500],
        'Jawa Barat' => [273000, 390000, 585000],
        'DKI Jakarta' => [280000, 400000, 600000],
        'Jawa Tengah' => [245000, 350000, 525000],
        'DI Yogyakarta' => [251300, 359000, 538500],
        'Jawa Timur' => [196000, 280000, 420000],
        'Bali' => [460600, 658000, 987000],
        'Nusa Tenggara Barat' => [252000, 360000, 540000],
        'Nusa Tenggara Timur' => [280000, 400000, 600000],
    ];

    public function run(): void
    {
        foreach ([MasterTarifSpj::JENIS_UANG_HARIAN => self::UANG_HARIAN, MasterTarifSpj::JENIS_PENGINAPAN => self::PENGINAPAN] as $jenis => $daftar) {
            foreach ($daftar as $provinsi => $nominal) {
                foreach (MasterTarifSpj::KATEGORI as $i => $kategori) {
                    MasterTarifSpj::firstOrCreate(
                        ['provinsi' => $provinsi, 'jenis' => $jenis, 'kategori' => $kategori, 'berlaku_mulai' => self::BERLAKU_MULAI],
                        ['nominal' => $nominal[$i], 'satuan' => 'OH'],
                    );
                }
            }
        }
    }
}
