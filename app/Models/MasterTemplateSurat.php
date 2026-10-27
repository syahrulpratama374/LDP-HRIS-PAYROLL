<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MasterTemplateSurat extends Model
{
    use HasFactory;

    protected $fillable = [
        'nama_template',
        'kode_surat',
        'konten',
        'kategori_alur', // Baru (Approval_Direksi atau Hanya_Notifikasi)
        'pembuat_kode',  // Baru (Misal: LDP-DIR, LDP-HC)
        'is_active',
    ];

    public function suratKeluars()
    {
        return $this->hasMany(SuratKeluar::class, 'template_id');
    }

    // Relasi ke Rute Approval (Cetak Biru)
    public function ruteApprovals()
    {
        return $this->hasMany(RuteApprovalTemplate::class, 'template_id')->orderBy('urutan_langkah', 'asc');
    }
}