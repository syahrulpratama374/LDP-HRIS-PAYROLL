<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MasterKomponenPayroll extends Model
{
    use HasFactory;

    protected $table = 'master_komponen_payrolls';
    protected $fillable = ['kode_komponen', 'nama_komponen', 'jenis', 'is_taxable'];
}