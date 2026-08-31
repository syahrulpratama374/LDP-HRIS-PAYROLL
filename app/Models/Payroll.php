<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Payroll extends Model
{
    use HasFactory;

    protected $fillable = [
        'karyawan_id', 
        'periode_bulan', 
        'periode_tahun', 
        'gaji_pokok_saat_itu', 
        'total_pemasukan', 
        'total_potongan', 
        'total_gaji_bersih', 
        'status'
    ];

    public function karyawan()
    {
        return $this->belongsTo(Karyawan::class);
    }

    public function detailPayrolls()
    {
        return $this->hasMany(DetailPayroll::class);
    }
}