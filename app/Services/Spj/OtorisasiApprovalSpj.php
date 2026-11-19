<?php

namespace App\Services\Spj;

use App\Models\DelegasiWewenang;
use App\Models\Karyawan;
use App\Models\RuteApprovalTemplate;
use App\Models\Spj;
use App\Models\SpjApproval;
use App\Models\User;

/**
 * Satu-satunya aturan siapa yang boleh menyetujui/menolak langkah SPJ (dipakai tampilan & proses):
 * - langkah bertipe role cocok dengan role user; bertipe jabatan cocok dengan jabatan karyawan
 *   (HC & Finance berlaku seluruh perusahaan, tanpa syarat departemen);
 * - Delegasi Wewenang berstatus 'Aktif' dengan hari ini dalam rentang tanggal: penerima mewarisi
 *   role/jabatan pemberi dan menyetujui atas nama pemberi;
 * - pengaju, peserta SPJ tersebut, dan Admin TIDAK boleh menyetujui (403), dengan saran memakai
 *   Delegasi Wewenang.
 */
class OtorisasiApprovalSpj
{
    public const SARAN_DELEGASI = 'Bila pejabat yang berwenang berhalangan atau ikut dalam SPJ ini, gunakan menu Delegasi Wewenang agar pejabat lain menyetujui atas nama beliau.';

    /**
     * @return array{boleh: bool, pesan: string, atas_nama: ?Karyawan}
     */
    public function periksa(Spj $spj, User $user, ?SpjApproval $langkah = null): array
    {
        $tolak = fn (string $pesan) => ['boleh' => false, 'pesan' => $pesan, 'atas_nama' => null];

        $langkah ??= $spj->langkahAktif();
        if ($spj->status !== Spj::STATUS_DIAJUKAN || ! $langkah || $langkah->status !== SpjApproval::MENUNGGU) {
            return $tolak('SPJ ini tidak sedang menunggu persetujuan.');
        }
        if ((int) $user->role_id === 1) {
            return $tolak('Admin tidak dapat menyetujui atau menandatangani SPJ. '.self::SARAN_DELEGASI);
        }
        if ((int) $spj->dibuat_oleh === (int) $user->id) {
            return $tolak('Pengaju tidak dapat menyetujui SPJ yang diajukannya sendiri. '.self::SARAN_DELEGASI);
        }

        $karyawan = Karyawan::where('user_id', $user->id)->first();
        if (! $karyawan) {
            return $tolak('Akun Anda tidak terhubung dengan data karyawan.');
        }
        if ($spj->memuatPeserta($karyawan->id)) {
            return $tolak('Peserta tidak dapat menyetujui SPJ yang memuat dirinya. '.self::SARAN_DELEGASI);
        }

        if ($this->cocok($langkah, $user, $karyawan)) {
            return ['boleh' => true, 'pesan' => '', 'atas_nama' => null];
        }

        $hariIni = now()->toDateString();
        $delegasis = DelegasiWewenang::with('pemberi.user')
            ->where('penerima_id', $karyawan->id)
            ->where('status', 'Aktif')
            ->whereDate('tgl_mulai', '<=', $hariIni)
            ->whereDate('tgl_selesai', '>=', $hariIni)
            ->get();
        foreach ($delegasis as $delegasi) {
            $pemberi = $delegasi->pemberi;
            if ($pemberi && $this->cocok($langkah, $pemberi->user, $pemberi)) {
                return ['boleh' => true, 'pesan' => '', 'atas_nama' => $pemberi];
            }
        }

        return $tolak("Anda tidak memiliki wewenang untuk langkah \"{$langkah->label_ttd}\" ({$langkah->namaPenyetuju()}).");
    }

    /** Id SPJ yang sedang menunggu tindakan user ini (untuk daftar & hak lihat). */
    public function idsMenungguUser(User $user): array
    {
        return Spj::where('status', Spj::STATUS_DIAJUKAN)->get()
            ->filter(fn (Spj $spj) => $this->periksa($spj, $user)['boleh'])
            ->pluck('id')->all();
    }

    private function cocok(SpjApproval $langkah, ?User $user, ?Karyawan $karyawan): bool
    {
        if ($langkah->tipe_penyetuju === RuteApprovalTemplate::TIPE_ROLE) {
            return $user !== null && (int) $user->role_id === (int) $langkah->role_id;
        }

        return $karyawan !== null && (int) $karyawan->jabatan_id === (int) $langkah->jabatan_id;
    }
}
