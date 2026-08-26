<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Approval extends Model
{
    protected $guarded = ['id'];

    //  menghubungkan approval ke Cuti, Lembur, atau SPJ
    public function approvable()
    {
        return $this->morphTo();
    }

    // yang menyetujui dokumen ini
    public function approver()
    {
        return $this->belongsTo(User::class, 'approver_id');
    }
}