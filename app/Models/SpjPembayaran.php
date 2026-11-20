<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/** Pembayaran SPJ (uang harian / reimburse) ke satu peserta, dicatat Finance dengan bukti transfer. */
class SpjPembayaran extends Model
{
    public const UANG_HARIAN = 'uang_harian';

    public const REIMBURSE = 'reimburse';

    public const JENIS = [
        'uang_harian' => 'Uang Harian',
        'reimburse' => 'Reimburse',
    ];

    protected $fillable = [
        'spj_peserta_id', 'jenis', 'nominal', 'tanggal_transfer', 'bukti_transfer_path',
        'rekening_encrypted', 'dicatat_oleh', 'catatan', 'dibatalkan_pada', 'dibatalkan_oleh', 'alasan_batal',
    ];

    protected $hidden = ['rekening_encrypted'];

    protected $casts = ['nominal' => 'decimal:2', 'dibatalkan_pada' => 'datetime'];

    /** Pembayaran yang berlaku (belum dibatalkan) — hanya ini yang dihitung ke total dibayar. */
    public function scopeAktif($q)
    {
        return $q->whereNull('dibatalkan_pada');
    }

    public function dibatalkan(): bool
    {
        return $this->dibatalkan_pada !== null;
    }

    public function peserta()
    {
        return $this->belongsTo(SpjPeserta::class, 'spj_peserta_id');
    }

    public function pencatat()
    {
        return $this->belongsTo(User::class, 'dicatat_oleh');
    }

    public function pembatal()
    {
        return $this->belongsTo(User::class, 'dibatalkan_oleh');
    }

    public function labelJenis(): string
    {
        return self::JENIS[$this->jenis] ?? $this->jenis;
    }
}
