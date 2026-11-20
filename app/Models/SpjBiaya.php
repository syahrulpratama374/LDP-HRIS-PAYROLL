<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/** Nota reimburse SPJ milik satu peserta; divalidasi Finance. */
class SpjBiaya extends Model
{
    public const MENUNGGU = 'Menunggu';

    public const DIVALIDASI = 'Divalidasi';

    public const DITOLAK = 'Ditolak';

    public const PENGINAPAN = 'penginapan';

    /** Jenis biaya => label tampilan. */
    public const JENIS = [
        'penginapan' => 'Penginapan',
        'tiket' => 'Tiket',
        'transport' => 'Transport',
        'lainnya' => 'Lainnya',
    ];

    protected $fillable = [
        'spj_peserta_id', 'jenis', 'tanggal', 'keterangan', 'jumlah_malam', 'nominal_nota', 'file_nota_path',
        'status', 'nominal_dibayar', 'diunggah_oleh', 'divalidasi_oleh', 'divalidasi_pada', 'catatan',
    ];

    protected $casts = [
        'nominal_nota' => 'decimal:2',
        'nominal_dibayar' => 'decimal:2',
        'divalidasi_pada' => 'datetime',
    ];

    public function peserta()
    {
        return $this->belongsTo(SpjPeserta::class, 'spj_peserta_id');
    }

    public function pengunggah()
    {
        return $this->belongsTo(User::class, 'diunggah_oleh');
    }

    public function validator()
    {
        return $this->belongsTo(User::class, 'divalidasi_oleh');
    }

    public function selisih()
    {
        return $this->hasOne(SpjSelisihPenginapan::class);
    }

    public function labelJenis(): string
    {
        return self::JENIS[$this->jenis] ?? ucfirst((string) $this->jenis);
    }
}
