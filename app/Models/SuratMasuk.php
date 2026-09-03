<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SuratMasuk extends Model
{
    use HasFactory;

    protected $fillable = [
        'nomor_surat_asal',
        'instansi_pengirim',
        'perihal',
        'tanggal_terima',
        'file_pdf',
        'diterima_oleh',
    ];

    public function penerima()
    {
        return $this->belongsTo(User::class, 'diterima_oleh');
    }
}