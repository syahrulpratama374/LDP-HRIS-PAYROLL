<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Langkah cetak biru approval milik template. Penyetuju ditunjuk lewat JABATAN (default, dipakai
 * Surat Keluar) atau ROLE (mis. HC / Finance, dipakai SPJ-PD).
 */
class RuteApprovalTemplate extends Model
{
    public const TIPE_JABATAN = 'jabatan';

    public const TIPE_ROLE = 'role';

    protected $fillable = [
        'template_id', 'urutan_langkah', 'tipe_penyetuju', 'role_id', 'jabatan_id', 'label_ttd',
    ];

    protected $attributes = [
        'tipe_penyetuju' => self::TIPE_JABATAN,
    ];

    public function template()
    {
        return $this->belongsTo(MasterTemplateSurat::class, 'template_id');
    }

    public function jabatan()
    {
        return $this->belongsTo(Jabatan::class, 'jabatan_id');
    }

    public function role()
    {
        return $this->belongsTo(Role::class, 'role_id');
    }

    public function berbasisRole(): bool
    {
        return $this->tipe_penyetuju === self::TIPE_ROLE;
    }
}
