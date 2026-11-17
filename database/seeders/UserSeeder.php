<?php

namespace Database\Seeders;

use App\Models\Departemen;
use App\Models\Golongan;
use App\Models\Jabatan;
use App\Models\Karyawan;
use App\Models\MasterPtkp;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Hash;

/**
 * Akun Super Admin + akun uji lama (legacy) di luar bagan organisasi LDP 2026.
 * Idempoten & terisolasi dari LdpStrukturSeeder:
 * - hanya menyentuh email miliknya sendiri (tidak ada yang berakhiran sama dengan akun struktur),
 * - password hanya diisi saat akun pertama kali dibuat (tidak me-reset password yang sudah diganti),
 * - tidak membuat master data baru; memakai departemen/jabatan/golongan dari MasterDataSeeder.
 */
class UserSeeder extends Seeder
{
    public const PASSWORD_DEFAULT = 'password123';

    /** email => [nama, username, role_id] */
    public const AKUN = [
        'admin@ldp.co.id' => ['Syahrul Pratama', 'syahrul.admin', 1],
        'direktur@ldp.co.id' => ['Direktur LDP', 'direktur', 2],
        'hrd@ldp.co.id' => ['HRD LDP', 'hrd', 3],
        'finance@ldp.co.id' => ['Finance LDP', 'finance', 4],
        'spv@ldp.co.id' => ['Supervisor Cabang', 'spv', 5],
    ];

    public function run(): void
    {
        foreach (self::AKUN as $email => [$nama, $username, $roleId]) {
            $this->sinkronUser($email, $nama, $username, $roleId, self::PASSWORD_DEFAULT);
        }

        // Akun karyawan uji lama (Kevin Tama) -> role_id 6, login dengan NIK
        $nik = '12345678';
        $user = $this->sinkronUser('kevin@gmail.com', 'Kevin Tama', $nik, 6, $nik);

        $karyawan = Karyawan::withTrashed()->firstOrNew(['user_id' => $user->id]);
        if (! $karyawan->exists) {
            $karyawan->fill([
                'nik_internal' => $nik,
                'tempat_lahir' => 'Bantul',
                'tgl_lahir' => '1995-12-24',
                'agama' => 'Islam',
                'status_pernikahan' => 'Belum Kawin',
                'tgl_bergabung' => now()->toDateString(),
                'no_ktp_encrypted' => Crypt::encryptString('3501234567899999'),
                'npwp_encrypted' => Crypt::encryptString('123456789012399'),
                'no_rek_bca_encrypted' => Crypt::encryptString('0123456788'),
                'ptkp_id' => MasterPtkp::where('kode_ptkp', 'TK/0')->value('id'),
            ]);
        }
        $karyawan->fill([
            'nama_lengkap' => 'Kevin Tama',
            'departemen_id' => Departemen::where('kode_departemen', 'IT')->value('id'),
            'jabatan_id' => Jabatan::where('kode_jabatan', 'STF')->value('id'),
            'golongan_id' => Golongan::where('kode_golongan', 'GOL-1A')->value('id'),
            'email_kantor' => 'kevin@gmail.com',
            'no_telp' => '082122223333',
            'status_aktif' => true,
        ]);
        $karyawan->deleted_at = null;
        $karyawan->save();
    }

    private function sinkronUser(string $email, string $nama, string $username, int $roleId, string $password): User
    {
        $user = User::firstOrNew(['email' => $email]);
        $user->fill(['name' => $nama, 'username' => $username, 'role_id' => $roleId]);
        if (! $user->exists) {
            $user->password = Hash::make($password);
            $user->email_verified_at = now();
        }
        $user->save();

        return $user;
    }
}
