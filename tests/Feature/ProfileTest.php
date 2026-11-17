<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

/**
 * Profil ESS: karyawan hanya boleh mengubah data Tier 1 (kontak & domisili)
 * dan tidak boleh menghapus akunnya sendiri.
 */
class ProfileTest extends TestCase
{
    use RefreshDatabase {
        beginDatabaseTransaction as private mulaiTransaksiBawaan;
    }

    public function beginDatabaseTransaction()
    {
        Schema::disableForeignKeyConstraints();
        $this->mulaiTransaksiBawaan();
    }

    private function buatKaryawan(User $user): int
    {
        return DB::table('karyawans')->insertGetId([
            'user_id' => $user->id,
            'departemen_id' => 1, 'jabatan_id' => 1, 'golongan_id' => 1, 'ptkp_id' => 1,
            'nik_internal' => 'NIK-PROFIL',
            'nama_lengkap' => 'Karyawan Profil',
            'tempat_lahir' => 'Yogyakarta', 'tgl_lahir' => '1995-01-01',
            'agama' => 'Islam', 'status_pernikahan' => 'Belum Kawin',
            'tgl_bergabung' => '2024-01-01',
            'no_ktp_encrypted' => 'x',
            'status_aktif' => true,
            'created_at' => now(), 'updated_at' => now(),
        ]);
    }

    public function test_profile_page_is_displayed(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->get('/profile')->assertOk();
    }

    public function test_data_tier1_karyawan_dapat_diperbarui(): void
    {
        $user = User::factory()->create();
        $karyawanId = $this->buatKaryawan($user);

        $this->actingAs($user)
            ->patch('/profile', [
                'no_telp' => '6281200000099',
                'alamat_domisili' => 'Jl. Malioboro 1',
                'nama_kontak_darurat' => 'Ibu Kandung',
                'no_telp_darurat' => '6281200000098',
            ])
            ->assertSessionHasNoErrors()
            ->assertRedirect('/profile');

        $karyawan = DB::table('karyawans')->find($karyawanId);
        $this->assertSame('6281200000099', $karyawan->no_telp);
        $this->assertSame('Ibu Kandung', $karyawan->nama_kontak_darurat);
    }

    public function test_kontak_darurat_wajib_diisi(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->from('/profile')
            ->patch('/profile', ['no_telp' => '6281200000099'])
            ->assertSessionHasErrors(['nama_kontak_darurat', 'no_telp_darurat'])
            ->assertRedirect('/profile');
    }

    public function test_karyawan_tidak_dapat_menghapus_akun(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->from('/profile')
            ->delete('/profile', ['password' => 'password'])
            ->assertSessionHasErrors('error')
            ->assertRedirect('/profile');

        $this->assertAuthenticated();
        $this->assertNotNull($user->fresh());
    }
}
