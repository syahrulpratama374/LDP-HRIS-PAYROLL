<?php

namespace App\Http\Controllers\Concerns;

use App\Models\DelegasiWewenang;
use App\Models\Karyawan;
use App\Models\User;

/**
 * Otorisasi approval pengajuan (cuti/lembur) berbasis hierarki atasan.
 *  - Tidak ada yang boleh memproses pengajuannya sendiri.
 *  - Admin (role 1) & HC (role 3) boleh memproses pengajuan siapa pun.
 *  - Selain itu hanya atasan langsung, atau penerima DelegasiWewenang aktif hari ini dari atasan langsung tersebut.
 */
trait OtorisasiApprovalAtasan
{
    protected function bolehMemproses(User $approver, ?Karyawan $pemohon): bool
    {
        if (! $pemohon) {
            return false;
        }

        $approverKaryawan = $approver->karyawan;

        if ($approverKaryawan && $approverKaryawan->id === $pemohon->id) {
            return false;
        }

        if (in_array((int) $approver->role_id, [1, 3], true)) {
            return true;
        }

        if (! $approverKaryawan || ! $pemohon->atasan_id) {
            return false;
        }

        if ((int) $pemohon->atasan_id === (int) $approverKaryawan->id) {
            return true;
        }

        $hariIni = now()->toDateString();

        return DelegasiWewenang::where('penerima_id', $approverKaryawan->id)
            ->where('pemberi_id', $pemohon->atasan_id)
            ->where('status', 'Aktif')
            ->whereDate('tgl_mulai', '<=', $hariIni)
            ->whereDate('tgl_selesai', '>=', $hariIni)
            ->exists();
    }

    protected function pastikanBolehMemproses(User $approver, ?Karyawan $pemohon): void
    {
        abort_unless(
            $this->bolehMemproses($approver, $pemohon),
            403,
            'Akses Ditolak: Anda hanya dapat memproses pengajuan bawahan langsung (atau titipan delegasi) dan bukan pengajuan Anda sendiri.'
        );
    }
}
