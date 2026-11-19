<?php

namespace Tests\Feature\Spj;

use App\Models\User;
use Database\Seeders\MasterTarifSpjSeeder;
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
}
