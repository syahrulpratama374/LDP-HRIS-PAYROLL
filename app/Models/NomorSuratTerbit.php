<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/** Register semua nomor surat yang sudah terbit (lintas modul); nomor unik, tidak dipakai ulang. */
class NomorSuratTerbit extends Model
{
    protected $fillable = [
        'nomor', 'tahun', 'urut', 'kode_jenis', 'kode_penerbit',
        'sumber_type', 'sumber_id', 'diterbitkan_pada',
    ];

    protected $casts = [
        'tahun' => 'integer',
        'urut' => 'integer',
        'diterbitkan_pada' => 'datetime',
    ];

    public function sumber()
    {
        return $this->morphTo();
    }
}
