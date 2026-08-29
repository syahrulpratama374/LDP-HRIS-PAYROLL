<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Karyawan extends Model
{
    use HasFactory, SoftDeletes;

    // "Daftar Putih" kolom yang diizinkan untuk diisi otomatis (Mass Assignment)
    protected $fillable = [
        'user_id',
        'departemen_id',
        'jabatan_id',
        'golongan_id',
        'ptkp_id',

        'nik_internal',
        'nama_lengkap',
        'tempat_lahir',
        'tgl_lahir',
        'agama',
        'status_pernikahan',
        'email_kantor',
        'no_telp',
        'tgl_bergabung',

        'no_ktp_encrypted',
        'npwp_encrypted',
        'no_rek_bca_encrypted',

        'no_bpjs_kesehatan',
        'no_bpjs_ketenagakerjaan',
        'status_aktif',
    ];

    // ==========================================
    // Jembatan Relasi (Foreign Keys)
    // ==========================================
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
    // ... relasi sebelumnya (user, departemen, jabatan, golongan)

    public function riwayatGajis()
    {
        // Mengurutkan dari tanggal berlakunya yang paling baru (descending)
        return $this->hasMany(RiwayatGaji::class)->orderBy('effective_date_start', 'desc');
    }

    public function riwayatJabatans()
    {
        return $this->hasMany(RiwayatJabatan::class)->orderBy('effective_date_start', 'desc');
    }
    // Jika Anda membuat Model untuk PTKP, Anda bisa membuka komentar ini:
    // public function ptkp() { 
    //     return $this->belongsTo(MasterPtkp::class, 'ptkp_id'); 
    // }
}
