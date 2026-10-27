<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RuteApprovalTemplate extends Model
{
    protected $fillable = [
        'template_id', 'urutan_langkah', 'jabatan_id', 'label_ttd'
    ];

    public function template()
    {
        return $this->belongsTo(MasterTemplateSurat::class, 'template_id');
    }

    public function jabatan()
    {
        return $this->belongsTo(Jabatan::class, 'jabatan_id');
    }
}