<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class JadwalShiftKaryawan extends Model
{
    use HasFactory;

    protected $table = 'jadwal_shift_karyawans';

    protected $fillable = [
        'karyawan_id',
        'shift_id',
        'tanggal',
    ];

    public function karyawan()
    {
        return $this->belongsTo(Karyawan::class);
    }

    public function shift()
    {
        return $this->belongsTo(MasterShift::class, 'shift_id');
    }
}