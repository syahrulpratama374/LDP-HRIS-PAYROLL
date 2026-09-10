<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Karyawan extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id', 'departemen_id', 'jabatan_id', 'golongan_id', 'ptkp_id',
        'nik_internal', 'nama_lengkap', 'tempat_lahir', 'tgl_lahir',
        'agama', 'status_pernikahan', 'email_kantor', 'no_telp', 'tgl_bergabung',
        'no_ktp_encrypted', 'npwp_encrypted', 'no_rek_bca_encrypted',
        'no_bpjs_kesehatan', 'no_bpjs_ketenagakerjaan', 'status_aktif',
        'atasan_id'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
    public function departemen()
    {
        return $this->belongsTo(Departemen::class);
    }
    public function jabatan()
    {
        return $this->belongsTo(Jabatan::class);
    }
    public function golongan()
    {
        return $this->belongsTo(Golongan::class);
    }
    public function riwayatGajis()
    {
        return $this->hasMany(RiwayatGaji::class)->orderBy('effective_date_start', 'desc');
    }
    public function riwayatJabatans()
    {
        return $this->hasMany(RiwayatJabatan::class)->orderBy('effective_date_start', 'desc');
    }
    public function atasan()
    {
        return $this->belongsTo(Karyawan::class, 'atasan_id');
    }
    public function bawahan()
    {
        return $this->hasMany(Karyawan::class, 'atasan_id');
    }
    
    // --- TAMBAHAN EXIT CLEARANCE ---
    public function pinjamans()
    {
        return $this->hasMany(PinjamanKaryawan::class, 'karyawan_id');
    }
    public function asets()
    {
        return $this->hasMany(Aset::class, 'penanggung_jawab_id');
    }
}