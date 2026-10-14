<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class KeluargaKaryawan extends Model
{
    use HasFactory;

    protected $table = 'keluarga_karyawans';

    protected $fillable = [
        'karyawan_id', 
        'jenis_relasi', 
        'nik_keluarga_encrypted',
        'nama_anggota', 
        'tgl_lahir',
        'jenis_kelamin',
        'status_tanggungan_bpjs'
    ];

    public function karyawan()
    {
        return $this->belongsTo(Karyawan::class);
    }
}