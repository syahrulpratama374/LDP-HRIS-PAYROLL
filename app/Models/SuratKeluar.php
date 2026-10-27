<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class SuratKeluar extends Model
{
    use HasFactory;

    protected $fillable = [
        'uuid',
        'template_id',
        'karyawan_id',
        'approver_id',
        'nomor_surat',
        'status',
        'status_approval',
        'jenis_ttd',
        'file_ttd_path',
        'qr_code_token',
        'tanggal_terbit',
        'file_pdf',
        'created_by',
        'isi_surat_final',
        'catatan_revisi',
        'alasan_batal',
    ];

    // Otomatis generate UUID acak saat draf surat pertama kali dibuat
    protected static function boot()
    {
        parent::boot();
        static::creating(function ($model) {
            if (empty($model->uuid)) {
                $model->uuid = (string) Str::uuid();
            }
        });
    }

    // Relasi ke tabel Master Template
    public function template()
    {
        return $this->belongsTo(MasterTemplateSurat::class, 'template_id');
    }

    // Relasi ke tabel Karyawan Tujuan
    public function karyawan()
    {
        return $this->belongsTo(Karyawan::class, 'karyawan_id');
    }

    // Relasi ke tabel Lampiran (One-to-Many)
    public function lampirans()
    {
        return $this->hasMany(LampiranSuratKeluar::class, 'surat_keluar_id');
    }
    // Relasi ke Transaksi Approval Aktual
    public function approvals()
    {
        return $this->hasMany(ApprovalSuratKeluar::class, 'surat_keluar_id')->orderBy('urutan_langkah', 'asc');
    }
}