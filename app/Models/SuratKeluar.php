<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SuratKeluar extends Model
{
    use HasFactory;

    protected $fillable = [
        'template_id',
        'karyawan_id',
        'nomor_surat',
        'status',
        'tanggal_terbit',
        'file_pdf',
        'created_by',
    ];

    public function template()
    {
        return $this->belongsTo(MasterTemplateSurat::class, 'template_id');
    }

    public function karyawan()
    {
        return $this->belongsTo(Karyawan::class, 'karyawan_id');
    }

    public function pembuat()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}