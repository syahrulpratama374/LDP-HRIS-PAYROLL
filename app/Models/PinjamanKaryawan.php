<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PinjamanKaryawan extends Model
{
    use HasFactory;

    protected $table = 'pinjaman_karyawans';

    protected $fillable = [
        'karyawan_id',
        'total_pinjaman',
        'tenor_bulan',
        'sisa_pinjaman',
        'status'
    ];

    public function karyawan()
    {
        return $this->belongsTo(Karyawan::class);
    }

    public function cicilans()
    {
        return $this->hasMany(CicilanPinjaman::class, 'pinjaman_id');
    }
}