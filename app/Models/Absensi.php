<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Absensi extends Model
{
    use HasFactory;

    protected $fillable = [
        'karyawan_id',
        'tanggal',
        'waktu_masuk',
        'koordinat_masuk',
        'foto_masuk_path',
        'waktu_keluar',
        'koordinat_keluar',
        'foto_keluar_path',
        'status_kehadiran'
    ];

    // Relasi balik ke Karyawan
    public function karyawan()
    {
        return $this->belongsTo(Karyawan::class);
    }
}
