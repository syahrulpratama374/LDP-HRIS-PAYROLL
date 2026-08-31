<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SuratPeringatan extends Model
{
    use HasFactory;

    protected $table = 'surat_peringatans';

    protected $fillable = [
        'karyawan_id',
        'jenis_sp',
        'tgl_mulai',
        'tgl_selesai',
        'keterangan',
        'file_surat_path'
    ];

    public function karyawan()
    {
        return $this->belongsTo(Karyawan::class, 'karyawan_id');
    }
}