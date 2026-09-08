<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SaldoCuti extends Model
{
    use HasFactory;

    // Tambahkan baris ini agar Laravel mengizinkan pengisian data
    protected $fillable = [
        'karyawan_id',
        'tahun_periode',
        'hak_cuti_tahunan',
        'cuti_terpakai'
    ];

    public function karyawan()
    {
        return $this->belongsTo(Karyawan::class);
    }
}