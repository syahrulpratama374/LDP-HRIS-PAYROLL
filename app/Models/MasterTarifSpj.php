<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Collection;

/**
 * Tarif SPJ per provinsi x jenis x kategori (satuan OH). Dikelola HC lewat menu Master Tarif SPJ.
 */
class MasterTarifSpj extends Model
{
    public const JENIS_UANG_HARIAN = 'uang_harian';

    public const JENIS_PENGINAPAN = 'penginapan';

    public const JENIS = [self::JENIS_UANG_HARIAN, self::JENIS_PENGINAPAN];

    public const KATEGORI = ['Staff', 'Manager', 'Direksi'];

    protected $fillable = ['provinsi', 'jenis', 'kategori', 'nominal', 'satuan', 'berlaku_mulai'];

    // berlaku_mulai sengaja tanpa cast date: cast date menyimpan 'Y-m-d H:i:s' sehingga pencocokan
    // firstOrCreate/unique pada tanggal tidak konsisten antara MySQL dan SQLite.
    protected $casts = [
        'nominal' => 'decimal:2',
    ];

    /** Tarif yang berlaku pada tanggal: berlaku_mulai terakhir <= tanggal. Null bila belum ada. */
    public static function tarifBerlaku(string $provinsi, string $jenis, string $kategori, $tanggal): ?self
    {
        return static::where('provinsi', $provinsi)
            ->where('jenis', $jenis)
            ->where('kategori', $kategori)
            ->whereDate('berlaku_mulai', '<=', Carbon::parse($tanggal)->toDateString())
            ->orderByDesc('berlaku_mulai')
            ->first();
    }

    /** Provinsi yang bisa dipilih di SPJ: hanya yang punya tarif uang harian. */
    public static function provinsiUangHarian(): Collection
    {
        return static::where('jenis', self::JENIS_UANG_HARIAN)->distinct()->orderBy('provinsi')->pluck('provinsi');
    }
}
