<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PengajuanSpj extends Model
{
    use HasFactory;

    protected $table = 'pengajuan_spjs';

    /**
     * Status SPJ yang dianggap "aktif" (perjalanan sudah disetujui atasan):
     * sedang berjalan (Menunggu Pelaporan), laporan sedang divalidasi Finance, atau Selesai.
     */
    public const STATUS_AKTIF = ['Menunggu Pelaporan', 'Menunggu Validasi Finance', 'Selesai'];

    protected $fillable = [
        'karyawan_id',
        'tujuan',
        'keperluan',
        'tgl_mulai',
        'tgl_selesai',
        'total_biaya',
        'file_bukti_path',
        'status_approval',
        'sudah_dibayar',
        'laporan_hasil', // bug lama: tidak ada di $fillable sehingga laporan tidak tersimpan
    ];

    public function karyawan()
    {
        return $this->belongsTo(Karyawan::class);
    }
    // Tambahkan di bawah fungsi karyawan()
    public function komponenBiaya()
    {
        return $this->hasMany(KomponenBiayaSpj::class, 'pengajuan_spj_id');
    }

    /**
     * SPJ aktif pada tanggal tertentu: status termasuk STATUS_AKTIF dan
     * tgl_mulai <= tanggal <= tgl_selesai. Dipakai untuk pengecualian radius
     * absensi, monitor absensi, dan Auto-Alpha (Dinas Luar otomatis).
     */
    public function scopeAktifPada(Builder $query, $tanggal): Builder
    {
        $tanggal = Carbon::parse($tanggal)->toDateString();

        return $query->whereIn('status_approval', self::STATUS_AKTIF)
            ->whereDate('tgl_mulai', '<=', $tanggal)
            ->whereDate('tgl_selesai', '>=', $tanggal);
    }
}