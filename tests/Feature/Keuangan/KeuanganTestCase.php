<?php

namespace Tests\Feature\Keuangan;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

/**
 * Basis test Keuangan: membuat data minimal lewat DB::table
 * (FK dimatikan agar tidak perlu membangun seluruh master data).
 */
abstract class KeuanganTestCase extends TestCase
{
    use RefreshDatabase {
        beginDatabaseTransaction as private mulaiTransaksiBawaan;
    }

    private int $seq = 0;

    // PRAGMA foreign_keys tidak berlaku di dalam transaksi, jadi dimatikan sebelum transaksi test dimulai
    public function beginDatabaseTransaction()
    {
        Schema::disableForeignKeyConstraints();
        $this->mulaiTransaksiBawaan();
    }

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutMiddleware(\Illuminate\Foundation\Http\Middleware\PreventRequestForgery::class);
        foreach ([1 => 'Admin', 2 => 'Direktur', 3 => 'HC', 4 => 'Finance', 5 => 'Supervisor', 6 => 'Karyawan'] as $id => $nama) {
            DB::table('roles')->insert(['id' => $id, 'nama_role' => $nama, 'created_at' => now(), 'updated_at' => now()]);
        }
    }

    /** Buat user + karyawan; kembalikan [User, karyawan_id]. */
    protected function buatUser(int $roleId, int $departemenId = 1, ?int $atasanId = null): array
    {
        $n = ++$this->seq;
        $user = User::factory()->create(['role_id' => $roleId]);
        $karyawanId = DB::table('karyawans')->insertGetId([
            'user_id' => $user->id,
            'departemen_id' => $departemenId,
            'jabatan_id' => 1, 'golongan_id' => 1, 'ptkp_id' => 1,
            'nik_internal' => "NIK{$n}",
            'nama_lengkap' => "Karyawan {$n}",
            'tempat_lahir' => 'Kediri', 'tgl_lahir' => '1995-01-01',
            'agama' => 'Islam', 'status_pernikahan' => 'Belum Menikah',
            'tgl_bergabung' => '2024-01-01',
            'no_ktp_encrypted' => 'x',
            'status_aktif' => true,
            'created_at' => now(), 'updated_at' => now(),
        ]);

        return [$user, $karyawanId];
    }

    /** Beri akses menu (route_name) ke sebuah role agar lolos DynamicRolePermission. */
    protected function beriMenu(int $roleId, string $routeName): void
    {
        $menuId = DB::table('menus')->insertGetId([
            'title' => $routeName, 'route_name' => $routeName,
            'order' => 0, 'is_active' => true,
            'created_at' => now(), 'updated_at' => now(),
        ]);
        DB::table('role_has_menus')->insert([
            'role_id' => $roleId, 'menu_id' => $menuId,
            'created_at' => now(), 'updated_at' => now(),
        ]);
    }

    protected function buatPinjaman(int $karyawanId, array $o = []): int
    {
        return DB::table('pinjaman_karyawans')->insertGetId(array_merge([
            'karyawan_id' => $karyawanId,
            'jenis_kasbon' => 'Finance',
            'departemen_id' => 1,
            'total_pinjaman' => 100000,
            'tenor_bulan' => 3,
            'sisa_pinjaman' => 100000,
            'alasan_pinjaman' => 'Test',
            'status' => 'Pending',
            'created_at' => now(), 'updated_at' => now(),
        ], $o));
    }

    protected function buatPayroll(int $karyawanId, string $status = 'Draft', int $bulan = 1, int $tahun = 2026): int
    {
        return DB::table('payrolls')->insertGetId([
            'karyawan_id' => $karyawanId,
            'periode_bulan' => $bulan, 'periode_tahun' => $tahun,
            'status' => $status,
            'created_at' => now(), 'updated_at' => now(),
        ]);
    }
}
