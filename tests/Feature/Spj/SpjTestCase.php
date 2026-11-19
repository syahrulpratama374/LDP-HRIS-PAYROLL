<?php

namespace Tests\Feature\Spj;

use App\Models\User;
use Database\Seeders\MasterTarifSpjSeeder;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Tests\Feature\Persuratan\PersuratanTestCase;

/**
 * Basis test modul SPJ: memakai fixture persuratan (role, departemen, jabatan CEO/MGR/STF,
 * unit penerbit) ditambah master tarif SPJ.
 */
abstract class SpjTestCase extends PersuratanTestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(MasterTarifSpjSeeder::class);
    }

    /** User + karyawan dengan username & kategori tarif tertentu. */
    protected function karyawanSpj(string $username, int $roleId = 6, ?int $jabatanId = null, string $kategori = 'Staff', ?int $departemenId = null): User
    {
        $user = $this->buatUser($roleId, $departemenId, $jabatanId);
        $user->update(['username' => $username]);
        DB::table('karyawans')->where('user_id', $user->id)->update(['kategori_tarif_spj' => $kategori]);

        return $user->fresh();
    }

    protected function beriRekening(User $user, string $nomor = '1234567890'): void
    {
        DB::table('karyawans')->where('user_id', $user->id)
            ->update(['no_rek_bca_encrypted' => Crypt::encryptString($nomor)]);
    }

    protected function karyawanId(User $user): int
    {
        return (int) DB::table('karyawans')->where('user_id', $user->id)->value('id');
    }

    /** Data form SPJ contoh dokumen: Jawa Timur, 27-29 Agustus 2026. */
    protected function formSpj(array $pesertaIds, array $ubah = []): array
    {
        return array_merge([
            'provinsi' => 'Jawa Timur',
            'kota' => 'Surabaya',
            'tgl_berangkat' => '2026-08-27',
            'tgl_pulang' => '2026-08-29',
            'keperluan' => 'Instalasi perangkat pelanggan',
            'tanggal_risalah_awal' => null,
            'unit_penerbit_id' => $this->unit('LDP-HC')->id,
            'peserta' => $pesertaIds,
            'aksi' => 'draf',
        ], $ubah);
    }
}
