<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PengajuanLembur extends Model
{
    use HasFactory;

    protected $table = 'pengajuan_lemburs';

    protected $fillable = [
        'karyawan_id',
        'tanggal',
        'jam_mulai',
        'jam_selesai',
        'deskripsi_pekerjaan',
        'status_approval'
    ];

    public function karyawan()
    {
        return $this->belongsTo(Karyawan::class);
    }
}