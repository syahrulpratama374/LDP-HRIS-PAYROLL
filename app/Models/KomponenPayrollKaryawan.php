<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class KomponenPayrollKaryawan extends Model
{
    protected $table = 'komponen_payroll_karyawan';

    protected $fillable = ['karyawan_id', 'komponen_id', 'nominal'];

    public function karyawan()
    {
        return $this->belongsTo(Karyawan::class);
    }

    public function komponen()
    {
        return $this->belongsTo(MasterKomponenPayroll::class, 'komponen_id');
    }
}
