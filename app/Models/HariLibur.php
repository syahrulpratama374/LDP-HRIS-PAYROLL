<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HariLibur extends Model
{
    protected $fillable = [
        'tanggal',
        'keterangan',
        'is_cuti_bersama',
    ];

    protected $casts = [
        // Format Y-m-d agar serialisasi JSON ke frontend tetap "2026-08-17"
        'tanggal' => 'date:Y-m-d',
        'is_cuti_bersama' => 'boolean',
    ];
}
