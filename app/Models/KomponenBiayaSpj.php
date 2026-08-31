<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class KomponenBiayaSpj extends Model
{
    use HasFactory;

    protected $table = 'komponen_biaya_spjs';

    protected $fillable = [
        'pengajuan_spj_id',
        'jenis_biaya',
        'nominal',
        'keterangan',
        'file_nota_path'
    ];

    public function pengajuanSpj()
    {
        return $this->belongsTo(PengajuanSpj::class, 'pengajuan_spj_id');
    }
}