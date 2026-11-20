<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/** Selisih nota penginapan vs tarif per malam (dicatat saat nota divalidasi). */
class SpjSelisihPenginapan extends Model
{
    public const PERINGATAN = 'peringatan';

    public const INFO = 'info';

    protected $fillable = [
        'spj_biaya_id', 'spj_id', 'provinsi', 'kategori_tarif', 'jumlah_malam', 'nota_per_malam',
        'tarif_per_malam', 'selisih_per_malam', 'persen', 'tingkat',
    ];

    protected $casts = [
        'nota_per_malam' => 'decimal:2',
        'tarif_per_malam' => 'decimal:2',
        'selisih_per_malam' => 'decimal:2',
        'persen' => 'decimal:2',
    ];

    public function biaya()
    {
        return $this->belongsTo(SpjBiaya::class, 'spj_biaya_id');
    }

    public function spj()
    {
        return $this->belongsTo(Spj::class);
    }
}
