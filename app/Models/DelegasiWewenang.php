<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DelegasiWewenang extends Model
{
    use HasFactory;

    protected $table = 'delegasi_wewenangs';

    protected $fillable = [
        'pemberi_id',
        'penerima_id',
        'tgl_mulai',
        'tgl_selesai',
        'alasan',
        'status'
    ];

    // Relasi ke Manager/Atasan yang mendelegasikan
    public function pemberi()
    {
        return $this->belongsTo(Karyawan::class, 'pemberi_id');
    }

    // Relasi ke Manager/Atasan Pengganti (Plt/Pjs)
    public function penerima()
    {
        return $this->belongsTo(Karyawan::class, 'penerima_id');
    }
}