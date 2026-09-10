<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Pengumuman extends Model
{
    use HasFactory;

    protected $table = 'pengumumans';

    protected $fillable = [
        'judul', 'konten', 'pembuat_id', 'target_audiens', 
        'tgl_mulai', 'tgl_selesai', 'tipe_banner', 'is_aktif'
    ];

    public function pembuat()
    {
        return $this->belongsTo(User::class, 'pembuat_id');
    }
}