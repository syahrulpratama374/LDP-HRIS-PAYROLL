<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

/**
 * SPJ Perjalanan Dinas (model baru, banyak peserta). Dibayar langsung oleh Finance, TIDAK lewat payroll.
 * Model lama per karyawan tetap di PengajuanSpj (tabel pengajuan_spjs).
 */
class Spj extends Model
{
    public const STATUS_DRAFT = 'Draft';

    public const STATUS_DIAJUKAN = 'Diajukan';

    public const STATUS_DISETUJUI = 'Disetujui';

    public const STATUS_DITOLAK = 'Ditolak';

    public const STATUS_SELESAI = 'Selesai';

    public const STATUS_DIBATALKAN = 'Dibatalkan';

    /** Role yang melihat semua SPJ: Admin, HC, Finance. */
    public const ROLE_LIHAT_SEMUA = [1, 3, 4];

    protected $fillable = [
        'uuid', 'nomor_surat', 'unit_penerbit_id', 'dibuat_oleh', 'koordinator_karyawan_id',
        'provinsi', 'kota', 'tgl_berangkat', 'tgl_pulang', 'jumlah_hari', 'jumlah_malam',
        'keperluan', 'tanggal_risalah_awal', 'status', 'total_uang_harian', 'diajukan_pada',
        'tanggal_terbit', 'qr_code_token', 'catatan_revisi',
    ];

    protected $casts = [
        'total_uang_harian' => 'decimal:2',
        'diajukan_pada' => 'datetime',
        'tanggal_terbit' => 'datetime',
    ];

    protected static function booted(): void
    {
        static::creating(function (Spj $spj) {
            $spj->uuid ??= (string) Str::uuid();
        });
    }

    public function pesertas()
    {
        return $this->hasMany(SpjPeserta::class)->orderBy('urutan');
    }

    public function pembuat()
    {
        return $this->belongsTo(User::class, 'dibuat_oleh');
    }

    public function unitPenerbit()
    {
        return $this->belongsTo(UnitPenerbitSurat::class, 'unit_penerbit_id');
    }

    /** SPJ yang boleh dilihat user: Admin/HC/Finance semua; lainnya buatan sendiri atau memuat dirinya. */
    public function scopeTerlihatOleh(Builder $q, User $user): Builder
    {
        if (in_array($user->role_id, self::ROLE_LIHAT_SEMUA, true)) {
            return $q;
        }
        $karyawanId = $user->karyawan?->id;

        return $q->where(fn ($w) => $w->where('dibuat_oleh', $user->id)
            ->when($karyawanId, fn ($w2) => $w2->orWhereHas('pesertas', fn ($p) => $p->where('karyawan_id', $karyawanId))));
    }

    public function bisaDiubahOleh(User $user): bool
    {
        return $this->status === self::STATUS_DRAFT && (int) $this->dibuat_oleh === (int) $user->id;
    }

    public function terlihatOleh(User $user): bool
    {
        return static::whereKey($this->id)->terlihatOleh($user)->exists();
    }
}
