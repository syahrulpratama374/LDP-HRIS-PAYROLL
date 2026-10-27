<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Model;

class LampiranSuratKeluar extends Model
{
    use HasFactory;

    protected $fillable = [
        'surat_keluar_id',
        'nama_file_asli',
        'file_path',
        'file_type',
        'file_size',
    ];

    public function suratKeluar()
    {
        return $this->belongsTo(SuratKeluar::class, 'surat_keluar_id');
    }
}