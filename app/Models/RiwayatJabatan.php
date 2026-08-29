<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RiwayatJabatan extends Model
{
    use HasFactory;

    protected $fillable = [
        'karyawan_id',
        'jabatan_id',
        'effective_date_start',
        'effective_date_end',
    ];

    // Relasi balik ke tabel Karyawan
    public function karyawan()
    {
        return $this->belongsTo(Karyawan::class);
    }

    // Relasi untuk menarik nama jabatan
    public function jabatan()
    {
        return $this->belongsTo(Jabatan::class);
    }
}