<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ItTicket extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'judul',
        'modul',
        'prioritas',
        'deskripsi',
        'file_lampiran',
        'status',
        'persentase_progress',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function riwayats()
    {
        return $this->hasMany(RiwayatItTicket::class, 'ticket_id')->orderBy('created_at', 'desc');
    }
}