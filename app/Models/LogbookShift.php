<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LogbookShift extends Model
{
    use HasFactory;

    protected $fillable = [
        'karyawan_id',
        'shift_id',
        'tanggal',
        'catatan_handover'
    ];

    public function karyawan()
    {
        return $this->belongsTo(Karyawan::class);
    }

    public function shift()
    {
        return $this->belongsTo(MasterShift::class);
    }
}