<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

/**
 * Unit "Yang Mengeluarkan" surat; kodenya menjadi segmen ke-3 nomor surat (mis. LDP-HC).
 */
class UnitPenerbitSurat extends Model
{
    protected $fillable = ['kode', 'nama', 'departemen_id', 'is_active'];

    protected $casts = ['is_active' => 'boolean'];

    public function departemen()
    {
        return $this->belongsTo(Departemen::class, 'departemen_id');
    }

    public function scopeAktif(Builder $q): Builder
    {
        return $q->where('is_active', true);
    }

    /**
     * Unit default untuk pembuat surat: unit aktif yang terpetakan ke departemen karyawannya.
     * Null bila pembuat tidak punya karyawan (mis. Admin) atau departemennya belum punya unit.
     */
    public static function defaultUntukUser(?User $user): ?self
    {
        $departemenId = $user?->karyawan?->departemen_id;

        return $departemenId
            ? static::aktif()->where('departemen_id', $departemenId)->first()
            : null;
    }
}
