<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RiwayatSuratApproval extends Model
{
    use HasFactory;

    protected $table = 'riwayat_surat_approvals';

    protected $fillable = [
        'surat_keluar_id',
        'user_id',
        'aksi',
        'catatan',
    ];

    public function suratKeluar()
    {
        return $this->belongsTo(SuratKeluar::class, 'surat_keluar_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}