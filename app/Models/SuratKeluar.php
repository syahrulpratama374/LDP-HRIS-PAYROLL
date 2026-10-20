<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SuratKeluar extends Model
{
    use HasFactory;

    protected $fillable = [
        'template_id',
        'karyawan_id',
        'approver_id', // Baru
        'nomor_surat',
        'status',
        'status_approval', // Baru
        'jenis_ttd', // Baru
        'file_ttd_path', // Baru
        'qr_code_token', // Baru
        'tanggal_terbit',
        'file_pdf',
        'created_by',
    ];

    public function template()
    {
        return $this->belongsTo(MasterTemplateSurat::class, 'template_id');
    }

    public function pembuat()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function karyawan()
    {
        return $this->belongsTo(Karyawan::class, 'karyawan_id');
    }

    // Relasi ke User (Direktur/Pimpinan) yang menyetujui
    public function approver()
    {
        return $this->belongsTo(User::class, 'approver_id');
    }

    // Relasi ke Riwayat Approval
    public function riwayatApprovals()
    {
        return $this->hasMany(RiwayatSuratApproval::class, 'surat_keluar_id')->latest();
    }
}