<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ApprovalSuratKeluar extends Model
{
    protected $fillable = [
        'surat_keluar_id', 'urutan_langkah', 'jabatan_id', 
        'user_id_aktual', 'label_ttd', 'status', 'waktu_approval', 'catatan'
    ];

    public function suratKeluar()
    {
        return $this->belongsTo(SuratKeluar::class, 'surat_keluar_id');
    }

    public function jabatan()
    {
        return $this->belongsTo(Jabatan::class, 'jabatan_id');
    }

    public function userAktual()
    {
        return $this->belongsTo(User::class, 'user_id_aktual');
    }
}