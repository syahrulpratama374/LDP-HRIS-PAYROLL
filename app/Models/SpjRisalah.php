<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/** Risalah Perjalanan Dinas (satu per SPJ). */
class SpjRisalah extends Model
{
    protected $fillable = ['spj_id', 'topik', 'tempat', 'waktu', 'diisi_oleh'];

    public function spj()
    {
        return $this->belongsTo(Spj::class);
    }

    public function details()
    {
        return $this->hasMany(SpjRisalahDetail::class)->orderBy('tanggal');
    }

    public function pengisi()
    {
        return $this->belongsTo(User::class, 'diisi_oleh');
    }

    /** Terisi = topik, tempat, waktu ada dan minimal satu tanggal punya kegiatan (syarat cetak & penutupan B9). */
    public function terisi(): bool
    {
        if (blank($this->topik) || blank($this->tempat) || blank($this->waktu)) {
            return false;
        }

        return $this->details->contains(fn (SpjRisalahDetail $d) => count($d->kegiatan ?? []) > 0);
    }
}
