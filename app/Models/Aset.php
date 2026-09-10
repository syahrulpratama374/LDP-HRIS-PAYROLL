<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Aset extends Model
{
    use HasFactory;

    protected $fillable = [
        'kode_aset', 'nama_aset', 'kategori', 'tgl_beli', 'harga_beli', 
        'tgl_expired_pajak', 'penanggung_jawab_id', 'status', 'qr_code_path'
    ];

    public function penanggungJawab()
    {
        return $this->belongsTo(Karyawan::class, 'penanggung_jawab_id');
    }
}