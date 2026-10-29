<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MasterPtkp extends Model
{
    use HasFactory;

    // Sesuaikan nama tabel jika berbeda di database Anda (misal: 'master_ptkps' atau 'ptkp')
    protected $table = 'master_ptkps';

    protected $guarded = ['id'];

    /**
     * Relasi balik ke Karyawan
     */
    public function karyawans(): HasMany
    {
        return $this->hasMany(Karyawan::class, 'ptkp_id');
    }
}