<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AuditTrail extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'modul',
        'aksi',
        'data_lama',
        'data_baru',
        'waktu',
    ];

    // TAMBAHKAN RELASI INI: Agar Controller mengenali siapa 'user'
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}