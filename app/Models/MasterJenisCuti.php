<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MasterJenisCuti extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    // Relasi balik: Satu jenis cuti bisa dimiliki banyak pengajuan
    public function pengajuanCuti()
    {
        return $this->hasMany(PengajuanCuti::class, 'jenis_cuti_id');
    }
}