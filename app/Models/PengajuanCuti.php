<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PengajuanCuti extends Model
{
    use HasFactory;

    protected $table = 'pengajuan_cutis';

    // Sesuaikan dengan nama kolom yang baru di tabel
    protected $fillable = [
        'karyawan_id',
        'jenis_cuti',
        'tanggal_mulai',
        'tanggal_selesai',
        'alasan',
        'dokumen_bukti_path',
        'status_approval'
    ];

    public function karyawan()
    {
        return $this->belongsTo(Karyawan::class);
    }
}