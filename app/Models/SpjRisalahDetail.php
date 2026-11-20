<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/** Detail risalah untuk satu tanggal perjalanan: daftar kegiatan + lampiran gambar. */
class SpjRisalahDetail extends Model
{
    protected $fillable = ['spj_risalah_id', 'tanggal', 'kegiatan'];

    protected $casts = ['kegiatan' => 'array'];

    public function risalah()
    {
        return $this->belongsTo(SpjRisalah::class, 'spj_risalah_id');
    }

    public function lampirans()
    {
        return $this->hasMany(SpjRisalahLampiran::class)->orderBy('id');
    }
}
