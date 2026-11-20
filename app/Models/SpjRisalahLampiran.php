<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/** Gambar rundown/foto pada satu tanggal risalah (disk privat 'local'). */
class SpjRisalahLampiran extends Model
{
    protected $fillable = ['spj_risalah_detail_id', 'path', 'nama_asli', 'ukuran', 'diunggah_oleh'];

    public function detail()
    {
        return $this->belongsTo(SpjRisalahDetail::class, 'spj_risalah_detail_id');
    }
}
