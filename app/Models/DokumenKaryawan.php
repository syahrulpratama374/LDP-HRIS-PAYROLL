<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DokumenKaryawan extends Model
{
    use HasFactory;

    // Definisikan nama tabel secara eksplisit (opsional tapi disarankan)
    protected $table = 'dokumen_karyawans';

    // Kolom-kolom yang diizinkan untuk diisi secara massal (Mass Assignment)
    protected $fillable = [
        'karyawan_id',
        'jenis_dokumen',
        'nama_dokumen',
        'file_path',
    ];

    /**
     * Relasi Balik (Inverse) ke Karyawan
     * Setiap 1 dokumen ini adalah milik 1 Karyawan.
     */
    public function karyawan()
    {
        return $this->belongsTo(Karyawan::class, 'karyawan_id');
    }
}