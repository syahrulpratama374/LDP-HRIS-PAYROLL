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
        'diselesaikan_pada', 'diselesaikan_oleh', 'dibatalkan_pada', 'dibatalkan_oleh', 'alasan_batal',
    ];

    protected $casts = [
        'total_uang_harian' => 'decimal:2',
        'diajukan_pada' => 'datetime',
        'tanggal_terbit' => 'datetime',
        'diselesaikan_pada' => 'datetime',
        'dibatalkan_pada' => 'datetime',
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

    public function approvals()
    {
        return $this->hasMany(SpjApproval::class)->orderBy('urutan_langkah');
    }

    /** Langkah persetujuan yang sedang menunggu (urutan terkecil berstatus Menunggu). */
    public function langkahAktif(): ?SpjApproval
    {
        return $this->approvals()->where('status', SpjApproval::MENUNGGU)->orderBy('urutan_langkah')->first();
    }

    public function pembuat()
    {
        return $this->belongsTo(User::class, 'dibuat_oleh');
    }

    public function penyelesai()
    {
        return $this->belongsTo(User::class, 'diselesaikan_oleh');
    }

    public function pembatal()
    {
        return $this->belongsTo(User::class, 'dibatalkan_oleh');
    }

    public function koordinator()
    {
        return $this->belongsTo(Karyawan::class, 'koordinator_karyawan_id');
    }

    public function risalah()
    {
        return $this->hasOne(SpjRisalah::class);
    }

    public function unitPenerbit()
    {
        return $this->belongsTo(UnitPenerbitSurat::class, 'unit_penerbit_id');
    }

    /**
     * SPJ yang boleh dilihat user: Admin/HC/Finance semua; lainnya buatan sendiri, memuat dirinya
     * sebagai peserta, pernah ia setujui/tolak, atau sedang menunggu tindakannya ($idsMenunggu dari
     * OtorisasiApprovalSpj::idsMenungguUser, termasuk lewat delegasi).
     */
    public function scopeTerlihatOleh(Builder $q, User $user, array $idsMenunggu = []): Builder
    {
        if (in_array($user->role_id, self::ROLE_LIHAT_SEMUA, true)) {
            return $q;
        }
        $karyawanId = $user->karyawan?->id;

        return $q->where(fn ($w) => $w->where('dibuat_oleh', $user->id)
            ->when($karyawanId, fn ($w2) => $w2->orWhereHas('pesertas', fn ($p) => $p->where('karyawan_id', $karyawanId)))
            ->orWhereHas('approvals', fn ($a) => $a->where('user_id_aktual', $user->id))
            ->when($idsMenunggu, fn ($w2) => $w2->orWhereIn('id', $idsMenunggu)));
    }

    /** Draf, atau SPJ yang ditolak (untuk direvisi lalu diajukan ulang), oleh pembuatnya. */
    public function bisaDiubahOleh(User $user): bool
    {
        return in_array($this->status, [self::STATUS_DRAFT, self::STATUS_DITOLAK], true)
            && (int) $this->dibuat_oleh === (int) $user->id;
    }

    public function memuatPeserta(?int $karyawanId): bool
    {
        return $karyawanId !== null && $this->pesertas()->where('karyawan_id', $karyawanId)->exists();
    }
}
