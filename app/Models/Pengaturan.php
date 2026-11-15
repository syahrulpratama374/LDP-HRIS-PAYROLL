<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Pengaturan extends Model
{
    use HasFactory;

    protected $fillable = [
        'kunci',
        'nilai',
        'keterangan',
    ];

    /** Ambil nilai pengaturan sebagai angka; pakai $default bila belum diatur / bukan angka. */
    public static function angka(string $kunci, float $default = 0): float
    {
        $nilai = static::where('kunci', $kunci)->value('nilai');

        return is_numeric($nilai) ? (float) $nilai : $default;
    }

    /** Ambil nilai pengaturan sebagai string. */
    public static function teks(string $kunci, string $default = ''): string
    {
        return static::where('kunci', $kunci)->value('nilai') ?? $default;
    }
}
