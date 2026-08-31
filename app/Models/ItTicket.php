<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ItTicket extends Model
{
    use HasFactory;

    protected $table = 'it_tickets';

    protected $fillable = [
        'user_id',
        'judul',
        'modul',
        'deskripsi',
        'file_lampiran',
        'prioritas',
        'status',
        'persentase_progress'
    ];

    // Karena di migrasi Anda menggunakan user_id, maka relasinya ke tabel User
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}