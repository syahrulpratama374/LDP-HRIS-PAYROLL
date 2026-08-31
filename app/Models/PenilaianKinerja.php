<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PenilaianKinerja extends Model
{
    use HasFactory;

    protected $table = 'penilaian_kinerjas';

    // Daftarkan kolom yang diizinkan untuk diisi datanya (Mass Assignment)
    protected $fillable = [
        'karyawan_id',
        'penilai_id',
        'periode_bulan',
        'periode_tahun',
        'skor_kpi',
        'catatan_evaluasi'
    ];

    // Relasi ke Karyawan yang sedang dinilai
    public function karyawan()
    {
        return $this->belongsTo(Karyawan::class, 'karyawan_id');
    }

    // Relasi ke Karyawan (Atasan/Supervisor) yang memberikan nilai
    public function penilai()
    {
        return $this->belongsTo(Karyawan::class, 'penilai_id');
    }
}