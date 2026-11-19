<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;

/**
 * Data UJI: rekening DUMMY (bukan rekening asli) untuk akun uji SPJ fahla dan staff.cre1,
 * supaya alur pengajuan SPJ (yang mewajibkan rekening tiap peserta) bisa dicoba.
 * Hanya mengisi bila rekening masih kosong. down() hanya mengosongkan nilai dummy ini.
 * GANTI dengan rekening asli lewat menu Data Karyawan sebelum dipakai untuk transfer.
 */
return new class extends Migration
{
    /** username => nomor rekening dummy (awalan 999 = jelas bukan rekening asli) */
    private const DUMMY = [
        'fahla' => '9990000001',
        'staff.cre1' => '9990000002',
    ];

    public function up(): void
    {
        foreach (self::DUMMY as $username => $rekening) {
            $karyawan = $this->karyawan($username);
            if ($karyawan && blank($karyawan->no_rek_bca_encrypted)) {
                DB::table('karyawans')->where('id', $karyawan->id)
                    ->update(['no_rek_bca_encrypted' => Crypt::encryptString($rekening)]);
            }
        }
    }

    public function down(): void
    {
        foreach (self::DUMMY as $username => $rekening) {
            $karyawan = $this->karyawan($username);
            if (! $karyawan || blank($karyawan->no_rek_bca_encrypted)) {
                continue;
            }
            try {
                $isi = Crypt::decryptString($karyawan->no_rek_bca_encrypted);
            } catch (Throwable) {
                continue;
            }
            if ($isi === $rekening) {
                DB::table('karyawans')->where('id', $karyawan->id)->update(['no_rek_bca_encrypted' => null]);
            }
        }
    }

    private function karyawan(string $username): ?object
    {
        return DB::table('karyawans')->join('users', 'users.id', '=', 'karyawans.user_id')
            ->where('users.username', $username)
            ->select('karyawans.id', 'karyawans.no_rek_bca_encrypted')
            ->first();
    }
};
