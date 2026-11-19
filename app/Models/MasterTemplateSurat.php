<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MasterTemplateSurat extends Model
{
    use HasFactory;

    /** Gaya kepala surat di PDF: judul tengah bergaris bawah + Nomor (A), atau blok Nomor/Lampiran/Hal (B). */
    public const GAYA_JUDUL_TENGAH = 'judul_tengah';

    public const GAYA_BLOK_NOMOR = 'blok_nomor';

    public const GAYA_KEPALA = [self::GAYA_JUDUL_TENGAH, self::GAYA_BLOK_NOMOR];

    protected $fillable = [
        'nama_template',
        'kode_surat',
        'konten',
        'kategori_alur', // Baru (Approval_Direksi atau Hanya_Notifikasi)
        'gaya_kepala',
        'pembuat_kode',  // TIDAK DIPAKAI lagi untuk penomoran; penerbit kini dipilih per surat (unit_penerbit_surats)
        'is_active',
    ];

    public function suratKeluars()
    {
        return $this->hasMany(SuratKeluar::class, 'template_id');
    }

    /**
     * Template dengan langkah approval berbasis ROLE (mis. SPJ-PD) khusus dipakai modul lain;
     * Surat Keluar hanya mendukung rute berbasis jabatan.
     */
    public function scopeTanpaRuteRole($query)
    {
        return $query->whereDoesntHave('ruteApprovals', fn ($q) => $q->where('tipe_penyetuju', RuteApprovalTemplate::TIPE_ROLE));
    }

    // Relasi ke Rute Approval (Cetak Biru)
    public function ruteApprovals()
    {
        return $this->hasMany(RuteApprovalTemplate::class, 'template_id')->orderBy('urutan_langkah', 'asc');
    }
}