<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CicilanPinjaman extends Model
{
    use HasFactory;

    protected $table = 'cicilan_pinjamans';

    protected $fillable = [
        'pinjaman_id',
        'payroll_id',
        'nominal_cicilan',
        'jatuh_tempo',
        'status_bayar'
    ];

    public function pinjaman()
    {
        return $this->belongsTo(PinjamanKaryawan::class, 'pinjaman_id');
    }
}