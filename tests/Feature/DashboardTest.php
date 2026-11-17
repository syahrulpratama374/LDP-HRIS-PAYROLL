<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\Feature\Keuangan\KeuanganTestCase;

/**
 * Dashboard harus terbuka (200) untuk seluruh role; role 1–4 memakai dashboard eksekutif,
 * role 5 & 6 tetap memakai halaman Supervisor/Karyawan.
 */
class DashboardTest extends KeuanganTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        DB::table('departemens')->insert([
            ['id' => 1, 'kode_departemen' => 'OPM', 'nama_departemen' => 'Operation & Maintenance', 'is_wajib_logbook' => false, 'created_at' => now(), 'updated_at' => now()],
            ['id' => 2, 'kode_departemen' => 'FIN', 'nama_departemen' => 'Finance & Accounting', 'is_wajib_logbook' => false, 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    /** Isi data operasional agar seluruh query agregat ikut teruji. */
    private function isiDataOperasional(): void
    {
        [, $k1] = $this->buatUser(6, 1);
        [, $k2] = $this->buatUser(6, 2);
        $hariIni = now('Asia/Jakarta')->toDateString();

        DB::table('absensis')->insert([
            ['karyawan_id' => $k1, 'tanggal' => $hariIni, 'status' => 'Hadir', 'created_at' => now(), 'updated_at' => now()],
            ['karyawan_id' => $k2, 'tanggal' => $hariIni, 'status' => 'Terlambat', 'created_at' => now(), 'updated_at' => now()],
        ]);
        DB::table('pengajuan_cutis')->insert([
            'karyawan_id' => $k1, 'jenis_cuti_id' => 1, 'tanggal_mulai' => $hariIni, 'tanggal_selesai' => $hariIni,
            'alasan' => 'Test', 'status_approval' => 'Pending', 'created_at' => now(), 'updated_at' => now(),
        ]);
        DB::table('pengajuan_lemburs')->insert([
            'karyawan_id' => $k2, 'tanggal' => $hariIni, 'jam_mulai' => '17:00:00', 'jam_selesai' => '20:00:00',
            'deskripsi_pekerjaan' => 'Maintenance', 'status_approval' => 'Pending', 'created_at' => now(), 'updated_at' => now(),
        ]);
        $this->buatPinjaman($k1, ['status' => 'Berjalan', 'sisa_pinjaman' => 300000]);
        $this->buatPinjaman($k2, ['status' => 'Disetujui Atasan']);

        $payrollId = $this->buatPayroll($k1, 'Draft', (int) now('Asia/Jakarta')->month, (int) now('Asia/Jakarta')->year);
        DB::table('payrolls')->where('id', $payrollId)->update(['total_gaji_bersih' => 4500000]);
        foreach ([['Gaji Pokok', 'Pemasukan', 5000000], ['Uang Lembur (3 jam)', 'Pemasukan', 150000], ['PPh 21 (TER)', 'Potongan', 100000], ['Cicilan Kasbon', 'Potongan', 100000]] as [$nama, $jenis, $nominal]) {
            DB::table('detail_payrolls')->insert([
                'payroll_id' => $payrollId, 'nama_komponen_snapshot' => $nama, 'jenis' => $jenis,
                'nominal' => $nominal, 'created_at' => now(), 'updated_at' => now(),
            ]);
        }
    }

    public static function roleEksekutif(): array
    {
        return ['Super Admin' => [1], 'Direktur' => [2], 'HC' => [3], 'Finance' => [4]];
    }

    #[DataProvider('roleEksekutif')]
    public function test_dashboard_eksekutif_tampil_untuk_role_manajemen(int $roleId): void
    {
        $this->isiDataOperasional();
        [$user] = $this->buatUser($roleId, 1);

        $this->actingAs($user)->get('/dashboard')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Dashboard')
                ->where('kpi.karyawan.total', 3)
                ->where('kpi.karyawan.departemen', 2)
                ->where('kpi.kehadiran.total', 2)
                ->where('kpi.cuti.cuti', 0)
                ->where('kpi.kasbon.jumlah', 1)
                ->where('kpi.payroll.bulanBerjalan', true)
                ->where('jumlahPending.cuti', 1)
                ->where('jumlahPending.lembur', 1)
                ->where('jumlahPending.kasbon', 1)
                ->has('pending', 3)
                ->has('sebaranDepartemen', 2)
                ->has('komposisiPayroll', 4)
                ->where('komposisiPayroll.0.nilai', 5000000)
                ->where('komposisiPayroll.1.nilai', 150000)
                ->where('komposisiPayroll.2.nilai', 100000)
                ->where('komposisiPayroll.3.nilai', 100000)
            );
    }

    public function test_dashboard_eksekutif_tanpa_data_dan_tanpa_profil_karyawan(): void
    {
        $admin = User::factory()->create(['role_id' => 1]);

        $this->actingAs($admin)->get('/dashboard')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Dashboard')
                ->where('kpi.karyawan.total', 0)
                ->where('kpi.payroll.total', 0)
                ->has('pending', 0)
            );
    }

    public function test_pintasan_hanya_menampilkan_menu_yang_diizinkan(): void
    {
        $this->beriMenu(4, 'admin.payroll.index');
        [$finance] = $this->buatUser(4, 2);

        $this->actingAs($finance)->get('/dashboard')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('pintasan', 1)
                ->where('pintasan.0.kunci', 'admin.payroll.index')
                ->where('aksiUtama.label', 'Generate Payroll')
            );
    }

    public function test_dashboard_supervisor_tetap_memakai_halaman_supervisor(): void
    {
        $this->isiDataOperasional();
        [$spv] = $this->buatUser(5, 1);

        $this->actingAs($spv)->get('/dashboard')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('Dashboard/Supervisor'));
    }

    public function test_dashboard_karyawan_tetap_memakai_halaman_karyawan(): void
    {
        [$karyawan] = $this->buatUser(6, 1);

        $this->actingAs($karyawan)->get('/dashboard')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('Dashboard/Karyawan'));
    }
}
