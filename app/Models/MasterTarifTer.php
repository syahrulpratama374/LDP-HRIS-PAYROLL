<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MasterTarifTer extends Model
{
    protected $table = 'master_tarif_ter';

    protected $fillable = ['kategori', 'batas_bawah', 'batas_atas', 'tarif'];
}
