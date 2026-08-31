<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PengajuanSpj extends Model
{
    use HasFactory;

    protected $table = 'pengajuan_spjs';

    protected $fillable = [
        'karyawan_id',
        'tujuan',
        'keperluan',
        'tgl_mulai',
        'tgl_selesai',
        'total_biaya',
        'file_bukti_path',
        'status_approval',
        'sudah_dibayar'
    ];

    public function karyawan()
    {
        return $this->belongsTo(Karyawan::class);
    }
    // Tambahkan di bawah fungsi karyawan()
    public function komponenBiaya()
    {
        return $this->hasMany(KomponenBiayaSpj::class, 'pengajuan_spj_id');
    }
}