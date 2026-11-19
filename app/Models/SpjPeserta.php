<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/** Peserta SPJ + snapshot perhitungan (dibekukan saat SPJ diajukan). */
class SpjPeserta extends Model
{
    protected $fillable = [
        'spj_id', 'karyawan_id', 'urutan', 'nama', 'posisi', 'departemen', 'kategori_tarif',
        'tarif_uang_harian', 'total_uang_harian', 'tarif_penginapan', 'batas_penginapan', 'rekening_encrypted',
    ];

    protected $hidden = ['rekening_encrypted'];

    protected $casts = [
        'tarif_uang_harian' => 'decimal:2',
        'total_uang_harian' => 'decimal:2',
        'tarif_penginapan' => 'decimal:2',
        'batas_penginapan' => 'decimal:2',
    ];

    public function spj()
    {
        return $this->belongsTo(Spj::class);
    }

    public function karyawan()
    {
        return $this->belongsTo(Karyawan::class);
    }
}
