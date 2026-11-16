<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PerformanceAppraisal extends Model
{
    protected $fillable = [
        'karyawan_id',
        'periode_bulan',
        'periode_tahun',
        'nilai_huruf',
        'skor',
        'catatan',
    ];

    protected $casts = [
        'periode_bulan' => 'integer',
        'periode_tahun' => 'integer',
        'skor' => 'decimal:2',
    ];
}
