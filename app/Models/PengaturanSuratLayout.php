<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PengaturanSuratLayout extends Model
{
    protected $fillable = [
        'tahun_periode', 'nama_perusahaan', 'slogan', 'alamat', 
        'telepon', 'email', 'website', 'logo_header_path', 
        'watermark_path', 'logo_iso_paths', 'banner_footer_path', 'is_active'
    ];

    protected $casts = [
        'logo_iso_paths' => 'array',
        'is_active' => 'boolean',
    ];
}