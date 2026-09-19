<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Departemen extends Model
{
    use HasFactory;

    // Buka gerbang mass-assignment untuk 3 kolom ini
    protected $fillable = [
        'kode_departemen',
        'nama_departemen',
        'is_wajib_logbook', // <-- Tambahan baru
    ];

    // Beritahu Laravel agar is_wajib_logbook selalu dibaca sebagai true/false (boolean)
    protected $casts = [
        'is_wajib_logbook' => 'boolean',
    ];
}