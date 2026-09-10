<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MasterShift extends Model
{
    use HasFactory;

    // TAMBAHKAN BARIS INI UNTUK MEMBERI IZIN INSERT DATA
    protected $fillable = [
        'kode_shift',
        'nama_shift',
        'jam_masuk',
        'jam_keluar',
        'lintas_hari',
    ];
}