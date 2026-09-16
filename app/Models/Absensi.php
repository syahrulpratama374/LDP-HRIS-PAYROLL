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
        'status',
        'catatan',
    ];

// UBAH BAGIAN INI SAJA
    protected $casts = [
        'tanggal' => 'date',
        // Tambahkan format khusus Y-m-d H:i:s agar Laravel tidak mengubahnya jadi UTC (Z)
        'waktu_masuk' => 'datetime:Y-m-d H:i:s',
        'waktu_keluar' => 'datetime:Y-m-d H:i:s',
    ];

    public function karyawan()
    {
        return $this->belongsTo(Karyawan::class);
    }
}