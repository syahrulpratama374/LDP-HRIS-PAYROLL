<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/** Penghitung nomor urut surat per kunci urutan; dikelola PenomoranSuratService. */
class PenomoranSurat extends Model
{
    protected $fillable = ['kunci', 'nomor_terakhir'];

    protected $casts = ['nomor_terakhir' => 'integer'];
}
