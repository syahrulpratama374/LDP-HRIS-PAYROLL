<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DetailPayroll extends Model
{
    use HasFactory;

    protected $fillable = [
        'payroll_id', 
        'komponen_id', 
        'nama_komponen_snapshot', 
        'jenis', 
        'nominal'
    ];

    public function payroll()
    {
        return $this->belongsTo(Payroll::class);
    }

    public function masterKomponen()
    {
        return $this->belongsTo(MasterKomponenPayroll::class, 'komponen_id');
    }
}