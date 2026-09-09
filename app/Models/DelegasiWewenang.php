<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DelegasiWewenang extends Model
{
    use HasFactory;

    protected $fillable = [
        'pemberi_id',
        'penerima_id',
        'tgl_mulai',
        'tgl_selesai',
        'alasan',
        'status'
    ];

    public function pemberi()
    {
        return $this->belongsTo(Karyawan::class, 'pemberi_id');
    }

    public function penerima()
    {
        return $this->belongsTo(Karyawan::class, 'penerima_id');
    }
}