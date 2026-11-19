<?php

namespace App\Services\Spj;

use App\Models\User;
use Illuminate\Support\Facades\Crypt;

/**
 * Aturan tampilan rekening peserta SPJ: lengkap untuk Admin, HC, Finance, dan untuk pemilik
 * rekening itu sendiri; selain itu disamarkan (****1234). Berlaku di form, daftar, detail, dan PDF.
 */
class RekeningSpj
{
    public const ROLE_LIHAT_PENUH = [1, 3, 4];

    public static function bolehLihatPenuh(?User $user): bool
    {
        return $user && in_array($user->role_id, self::ROLE_LIHAT_PENUH, true);
    }

    /** Dekripsi aman; null bila kosong atau tidak bisa didekripsi. */
    public static function polos(?string $terenkripsi): ?string
    {
        if (blank($terenkripsi)) {
            return null;
        }
        try {
            $nilai = trim(Crypt::decryptString($terenkripsi));
        } catch (\Throwable) {
            return null;
        }

        return $nilai === '' ? null : $nilai;
    }

    public static function samarkan(?string $polos): ?string
    {
        return $polos === null ? null : '****'.substr($polos, -4);
    }

    /**
     * Nomor rekening untuk ditampilkan kepada $viewer: lengkap untuk Admin/HC/Finance dan untuk
     * pemilik rekening itu sendiri ($karyawanIdPemilik); selain itu disamarkan.
     */
    public static function untuk(?User $viewer, ?string $terenkripsi, ?int $karyawanIdPemilik = null): ?string
    {
        $polos = self::polos($terenkripsi);
        $milikSendiri = $karyawanIdPemilik !== null && $viewer?->karyawan?->id === $karyawanIdPemilik;

        return self::bolehLihatPenuh($viewer) || $milikSendiri ? $polos : self::samarkan($polos);
    }
}
