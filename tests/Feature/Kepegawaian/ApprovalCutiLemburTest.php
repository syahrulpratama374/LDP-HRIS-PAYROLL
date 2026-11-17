<?php

namespace Tests\Feature\Kepegawaian;

use Illuminate\Support\Facades\DB;
use Tests\Feature\Keuangan\KeuanganTestCase;

/**
 * H1: lembur lintas tengah malam; H2/H5/H6: otorisasi atasan langsung, guard status Pending,
 * hari kerja shift via is_wajib_logbook, dan jatah cuti default dari Pengaturan.
 */
class ApprovalCutiLemburTest extends KeuanganTestCase
{
    private const DEPT_REGULER = 1;

    private const DEPT_SHIFT = 2;

    protected function setUp(): void
    {
        parent::setUp();
        DB::table('departemens')->insert([
            ['id' => self::DEPT_REGULER, 'kode_departemen' => 'FIN', 'nama_departemen' => 'Finance', 'is_wajib_logbook' => false, 'created_at' => now(), 'updated_at' => now()],
            ['id' => self::DEPT_SHIFT, 'kode_departemen' => 'OPM', 'nama_departemen' => 'Operation & Maintenance', 'is_wajib_logbook' => true, 'created_at' => now(), 'updated_at' => now()],
        ]);
        foreach (['lembur.store', 'admin.cuti.status', 'admin.lembur.status'] as $route) {
            foreach ([3, 5, 6] as $role) {
                $this->beriMenu($role, $route);
            }
        }
    }

    private function lembur(int $karyawanId, string $status = 'Pending'): int
    {
        return DB::table('pengajuan_lemburs')->insertGetId([
            'karyawan_id' => $karyawanId, 'tanggal' => '2026-11-10',
            'jam_mulai' => '18:00', 'jam_selesai' => '20:00', 'deskripsi_pekerjaan' => 'x',
            'status_approval' => $status, 'created_at' => now(), 'updated_at' => now(),
        ]);
    }

    private function cuti(int $karyawanId, string $mulai, string $selesai, string $status = 'Pending'): int
    {
        $jenis = DB::table('master_jenis_cutis')->insertGetId([
            'nama_cuti' => 'Cuti Tahunan', 'kuota_default' => 12, 'potong_cuti_tahunan' => true,
            'created_at' => now(), 'updated_at' => now(),
        ]);

        return DB::table('pengajuan_cutis')->insertGetId([
            'karyawan_id' => $karyawanId, 'jenis_cuti_id' => $jenis,
            'tanggal_mulai' => $mulai, 'tanggal_selesai' => $selesai,
            'alasan' => 'x', 'status_approval' => $status, 'created_at' => now(), 'updated_at' => now(),
        ]);
    }

    // ---------- H1: lembur lintas tengah malam ----------

    public function test_lembur_lintas_tengah_malam_diterima(): void
    {
        [$user, $kid] = $this->buatUser(6, self::DEPT_SHIFT);

        $this->actingAs($user)->post(route('lembur.store'), [
            'tanggal' => '2026-11-10', 'jam_mulai' => '22:00', 'jam_selesai' => '02:00',
            'deskripsi_pekerjaan' => 'Maintenance backbone malam',
        ])->assertSessionHasNoErrors()->assertRedirect(route('lembur.index'));

        $this->assertDatabaseHas('pengajuan_lemburs', ['karyawan_id' => $kid, 'status_approval' => 'Pending']);
    }

    public function test_lembur_jam_sama_atau_lebih_dari_12_jam_ditolak(): void
    {
        [$user] = $this->buatUser(6);

        foreach ([['19:00', '19:00'], ['20:00', '09:00']] as [$mulai, $selesai]) {
            $this->actingAs($user)->post(route('lembur.store'), [
                'tanggal' => '2026-11-10', 'jam_mulai' => $mulai, 'jam_selesai' => $selesai,
                'deskripsi_pekerjaan' => 'x',
            ])->assertSessionHasErrors('jam_selesai');
        }

        $this->assertSame(0, DB::table('pengajuan_lemburs')->count());
    }

    // ---------- H2/H5: otorisasi atasan ----------

    public function test_spv_lintas_departemen_ditolak_403_untuk_cuti_dan_lembur(): void
    {
        [, $spvOpm] = $this->buatUser(5, self::DEPT_SHIFT);
        [, $staff] = $this->buatUser(6, self::DEPT_SHIFT, $spvOpm);
        [$spvLain] = $this->buatUser(5, self::DEPT_REGULER);

        $cuti = $this->cuti($staff, '2026-11-10', '2026-11-10');
        $lembur = $this->lembur($staff);

        $this->actingAs($spvLain)->patch(route('admin.cuti.status', $cuti), ['status_approval' => 'Disetujui'])->assertForbidden();
        $this->actingAs($spvLain)->patch(route('admin.lembur.status', $lembur), ['status_approval' => 'Disetujui'])->assertForbidden();

        $this->assertSame('Pending', DB::table('pengajuan_cutis')->find($cuti)->status_approval);
        $this->assertSame('Pending', DB::table('pengajuan_lemburs')->find($lembur)->status_approval);
    }

    public function test_atasan_langsung_boleh_dan_pengajuan_sendiri_ditolak(): void
    {
        [, $manager] = $this->buatUser(5);
        [$spvUser, $spv] = $this->buatUser(5, self::DEPT_REGULER, $manager);
        [, $staff] = $this->buatUser(6, self::DEPT_REGULER, $spv);

        $lemburStaff = $this->lembur($staff);
        $this->actingAs($spvUser)->patch(route('admin.lembur.status', $lemburStaff), ['status_approval' => 'Disetujui'])
            ->assertSessionHasNoErrors();
        $this->assertSame('Disetujui', DB::table('pengajuan_lemburs')->find($lemburStaff)->status_approval);

        $lemburSendiri = $this->lembur($spv);
        $this->actingAs($spvUser)->patch(route('admin.lembur.status', $lemburSendiri), ['status_approval' => 'Disetujui'])
            ->assertForbidden();
    }

    public function test_penerima_delegasi_aktif_boleh_memproses_bawahan_titipan(): void
    {
        [, $spvAsal] = $this->buatUser(5);
        [, $staff] = $this->buatUser(6, self::DEPT_REGULER, $spvAsal);
        [$penggantiUser, $pengganti] = $this->buatUser(5);

        DB::table('delegasi_wewenangs')->insert([
            'pemberi_id' => $spvAsal, 'penerima_id' => $pengganti,
            'tgl_mulai' => now()->subDay()->toDateString(), 'tgl_selesai' => now()->addDay()->toDateString(),
            'status' => 'Aktif', 'created_at' => now(), 'updated_at' => now(),
        ]);

        $lembur = $this->lembur($staff);
        $this->actingAs($penggantiUser)->patch(route('admin.lembur.status', $lembur), ['status_approval' => 'Ditolak'])
            ->assertSessionHasNoErrors();
        $this->assertSame('Ditolak', DB::table('pengajuan_lemburs')->find($lembur)->status_approval);
    }

    public function test_hc_boleh_memproses_lintas_departemen(): void
    {
        [$hc] = $this->buatUser(3);
        [, $spv] = $this->buatUser(5, self::DEPT_SHIFT);
        [, $staff] = $this->buatUser(6, self::DEPT_SHIFT, $spv);

        $lembur = $this->lembur($staff);
        $this->actingAs($hc)->patch(route('admin.lembur.status', $lembur), ['status_approval' => 'Disetujui'])
            ->assertSessionHasNoErrors();
        $this->assertSame('Disetujui', DB::table('pengajuan_lemburs')->find($lembur)->status_approval);
    }

    // ---------- H6: guard transisi status ----------

    public function test_hanya_pengajuan_pending_yang_dapat_diproses(): void
    {
        [$spvUser, $spv] = $this->buatUser(5);
        [, $staff] = $this->buatUser(6, self::DEPT_REGULER, $spv);

        $cuti = $this->cuti($staff, '2026-11-10', '2026-11-10', 'Ditolak');
        $lembur = $this->lembur($staff, 'Disetujui');

        $this->actingAs($spvUser)->patch(route('admin.cuti.status', $cuti), ['status_approval' => 'Disetujui'])
            ->assertSessionHasErrors('error');
        $this->actingAs($spvUser)->patch(route('admin.lembur.status', $lembur), ['status_approval' => 'Ditolak'])
            ->assertSessionHasErrors('error');

        $this->assertSame('Ditolak', DB::table('pengajuan_cutis')->find($cuti)->status_approval);
        $this->assertSame('Disetujui', DB::table('pengajuan_lemburs')->find($lembur)->status_approval);
        $this->assertSame(0, DB::table('saldo_cutis')->count());
    }

    // ---------- Hari kerja shift & jatah default ----------

    public function test_cuti_departemen_shift_menghitung_akhir_pekan_dan_jatah_dari_pengaturan(): void
    {
        DB::table('pengaturans')->insert(['kunci' => 'hak_cuti_default', 'nilai' => '15', 'created_at' => now(), 'updated_at' => now()]);
        [$spvUser, $spv] = $this->buatUser(5, self::DEPT_SHIFT);
        [, $noc] = $this->buatUser(6, self::DEPT_SHIFT, $spv);
        [, $reguler] = $this->buatUser(6, self::DEPT_REGULER, $spv);

        // Jumat 2026-11-13 s/d Senin 2026-11-16 = 4 hari kalender, 2 hari kerja reguler
        $cutiNoc = $this->cuti($noc, '2026-11-13', '2026-11-16');
        $cutiReg = $this->cuti($reguler, '2026-11-13', '2026-11-16');

        $this->actingAs($spvUser)->patch(route('admin.cuti.status', $cutiNoc), ['status_approval' => 'Disetujui'])->assertSessionHasNoErrors();
        $this->actingAs($spvUser)->patch(route('admin.cuti.status', $cutiReg), ['status_approval' => 'Disetujui'])->assertSessionHasNoErrors();

        $saldoNoc = DB::table('saldo_cutis')->where('karyawan_id', $noc)->first();
        $this->assertSame(15, (int) $saldoNoc->hak_cuti_tahunan);
        $this->assertSame(4, (int) $saldoNoc->cuti_terpakai);
        $this->assertSame(4, DB::table('absensis')->where('karyawan_id', $noc)->where('status', 'Cuti')->count());

        $this->assertSame(2, (int) DB::table('saldo_cutis')->where('karyawan_id', $reguler)->value('cuti_terpakai'));
    }

    public function test_cuti_departemen_shift_mengikuti_roster_bila_ada(): void
    {
        [$spvUser, $spv] = $this->buatUser(5, self::DEPT_SHIFT);
        [, $noc] = $this->buatUser(6, self::DEPT_SHIFT, $spv);
        foreach (['2026-11-14', '2026-11-15'] as $tgl) {
            DB::table('jadwal_shift_karyawans')->insert([
                'karyawan_id' => $noc, 'shift_id' => 1, 'tanggal' => $tgl, 'created_at' => now(), 'updated_at' => now(),
            ]);
        }

        $cuti = $this->cuti($noc, '2026-11-13', '2026-11-16');
        $this->actingAs($spvUser)->patch(route('admin.cuti.status', $cuti), ['status_approval' => 'Disetujui'])->assertSessionHasNoErrors();

        // Hanya Sabtu & Minggu yang terjadwal shift → 2 hari dipotong
        $this->assertSame(2, (int) DB::table('saldo_cutis')->where('karyawan_id', $noc)->value('cuti_terpakai'));
    }
}
