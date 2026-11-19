<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/** Langkah persetujuan SPJ (salinan rute template SPJ-PD). */
class SpjApproval extends Model
{
    public const MENUNGGU = 'Menunggu';

    public const DISETUJUI = 'Disetujui';

    public const DITOLAK = 'Ditolak';

    protected $fillable = [
        'spj_id', 'urutan_langkah', 'tipe_penyetuju', 'role_id', 'jabatan_id', 'label_ttd', 'status',
        'user_id_aktual', 'atas_nama_karyawan_id', 'waktu_approval', 'catatan', 'jenis_ttd', 'ttd_image_path',
    ];

    protected $casts = ['waktu_approval' => 'datetime'];

    public function spj()
    {
        return $this->belongsTo(Spj::class);
    }

    public function role()
    {
        return $this->belongsTo(Role::class);
    }

    public function jabatan()
    {
        return $this->belongsTo(Jabatan::class);
    }

    public function userAktual()
    {
        return $this->belongsTo(User::class, 'user_id_aktual');
    }

    public function atasNama()
    {
        return $this->belongsTo(Karyawan::class, 'atas_nama_karyawan_id');
    }

    /** Nama penyetuju yang dituju langkah ini, mis. "Role HC" atau "Chief Executive Officer". */
    public function namaPenyetuju(): string
    {
        return $this->tipe_penyetuju === RuteApprovalTemplate::TIPE_ROLE
            ? 'Role '.($this->role?->nama_role ?? '-')
            : ($this->jabatan?->nama_jabatan ?? '-');
    }
}
