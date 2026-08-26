<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
class Role extends Model
{
    // Mengizinkan semua kolom diisi secara massal, kecuali ID
    protected $guarded = ['id'];

    public function users()
    {
        return $this->hasMany(User::class);
    }
}