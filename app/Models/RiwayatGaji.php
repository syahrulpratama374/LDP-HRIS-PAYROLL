<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RiwayatGaji extends Model
{
    use HasFactory;

    protected $fillable = [
        'karyawan_id',
        'nominal_gaji_pokok',
        'effective_date_start',
        'effective_date_end',
    ];

    // Relasi balik ke tabel Karyawan
    public function karyawan()
    {
        return $this->belongsTo(Karyawan::class);
    }
}