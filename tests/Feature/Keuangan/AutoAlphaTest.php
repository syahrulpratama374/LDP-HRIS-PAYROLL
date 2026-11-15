<?php

namespace Tests\Feature\Keuangan;

use App\Models\Payroll;
use Database\Seeders\MasterTarifTerSeeder;
use Illuminate\Support\Facades\DB;

class AutoAlphaTest extends KeuanganTestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(MasterTarifTerSeeder::class);
        DB::table('master_ptkps')->insert([
            'id' => 1, 'kode_ptkp' => 'TK/0', 'nominal_neto_tahunan' => 54_000_000, 'kategori_ter' => 'A',
            'created_at' => now(), 'updated_at' => now(),
        ]);
    }

    private function alpha(string $tanggal)
    {
        $this->artisan('ldp:daily-automation', ['--tanggal' => $tanggal])->assertSuccessful();
    }

    private function statusAbsen(int $kid, string $tanggal): ?string
    {
        return DB::table('absensis')->where('karyawan_id', $kid)->whereDate('tanggal', $tanggal)->value('status');
    }

    public function test_alpha_dibuat_untuk_yang_tidak_absen_dan_tidak_cuti_di_hari_kerja(): void
    {
        [, $alpha] = $this->buatUser(6);
        [, $hadir] = $this->buatUser(6);
        [, $cuti] = $this->buatUser(6);
        [, $nonaktif] = $this->buatUser(6);
        DB::table('karyawans')->where('id', $nonaktif)->update(['status_aktif' => false]);

        DB::table('absensis')->insert(['karyawan_id' => $hadir, 'tanggal' => '2026-01-12', 'status' => 'Hadir', 'created_at' => now(), 'updated_at' => now()]);
        DB::table('pengajuan_cutis')->insert([
            'karyawan_id' => $cuti, 'tanggal_mulai' => '2026-01-12', 'tanggal_selesai' => '2026-01-13',
            'alasan' => 'x', 'status_approval' => 'Disetujui', 'created_at' => now(), 'updated_at' => now(),
        ]);

        $this->alpha('2026-01-12'); // Senin

        $this->assertSame('Alpha', $this->statusAbsen($alpha, '2026-01-12'));
        $this->assertSame('Hadir', $this->statusAbsen($hadir, '2026-01-12'));
        $this->assertNull($this->statusAbsen($cuti, '2026-01-12'));
        $this->assertNull($this->statusAbsen($nonaktif, '2026-01-12'));

        // idempoten
        $this->alpha('2026-01-12');
        $this->assertSame(1, DB::table('absensis')->where('karyawan_id', $alpha)->count());
    }

    public function test_tidak_ada_alpha_di_akhir_pekan_hari_libur_dan_off_shift(): void
    {
        [, $reguler] = $this->buatUser(6);
        DB::table('departemens')->insert(['id' => 2, 'kode_departemen' => 'NOC', 'nama_departemen' => 'NOC', 'is_wajib_logbook' => true, 'created_at' => now(), 'updated_at' => now()]);
        [, $shiftTerjadwal] = $this->buatUser(6, 2);
        [, $shiftOff] = $this->buatUser(6, 2);

        $this->alpha('2026-01-10'); // Sabtu
        $this->assertNull($this->statusAbsen($reguler, '2026-01-10'));

        DB::table('hari_liburs')->insert(['tanggal' => '2026-01-13', 'keterangan' => 'Libur', 'is_cuti_bersama' => false, 'created_at' => now(), 'updated_at' => now()]);
        $this->alpha('2026-01-13'); // Selasa libur
        $this->assertNull($this->statusAbsen($reguler, '2026-01-13'));

        DB::table('jadwal_shift_karyawans')->insert(['karyawan_id' => $shiftTerjadwal, 'shift_id' => 1, 'tanggal' => '2026-01-14', 'created_at' => now(), 'updated_at' => now()]);
        $this->alpha('2026-01-14');
        $this->assertSame('Alpha', $this->statusAbsen($shiftTerjadwal, '2026-01-14'));
        $this->assertNull($this->statusAbsen($shiftOff, '2026-01-14'));
        $this->assertSame('Alpha', $this->statusAbsen($reguler, '2026-01-14'));
    }

    public function test_cuti_disetujui_diubah_jadi_absensi_cuti_dengan_nama_jenis(): void
    {
        [, $kid] = $this->buatUser(6);
        $jenis = DB::table('master_jenis_cutis')->insertGetId(['nama_cuti' => 'Cuti Tahunan', 'kuota_default' => 12, 'potong_cuti_tahunan' => true, 'created_at' => now(), 'updated_at' => now()]);
        $hari = now()->toDateString();
        DB::table('pengajuan_cutis')->insert([
            'karyawan_id' => $kid, 'jenis_cuti_id' => $jenis, 'tanggal_mulai' => $hari, 'tanggal_selesai' => $hari,
            'alasan' => 'x', 'status_approval' => 'Disetujui', 'created_at' => now(), 'updated_at' => now(),
        ]);

        $this->artisan('ldp:daily-automation')->assertSuccessful();

        $a = DB::table('absensis')->where('karyawan_id', $kid)->whereDate('tanggal', $hari)->first();
        $this->assertSame('Cuti', $a->status);
        $this->assertStringContainsString('Cuti Tahunan', $a->catatan);
    }

    public function test_alpha_otomatis_memotong_gaji_di_payroll(): void
    {
        [$admin] = $this->buatUser(1);
        [, $kid] = $this->buatUser(6);
        DB::table('riwayat_gajis')->insert([
            'karyawan_id' => $kid, 'nominal_gaji_pokok' => 8_800_000,
            'effective_date_start' => '2024-01-01', 'effective_date_end' => null,
            'created_at' => now(), 'updated_at' => now(),
        ]);

        // 2 hari kerja tanpa absensi → 2 Alpha
        $this->alpha('2026-01-12');
        $this->alpha('2026-01-13');
        $this->assertSame(2, DB::table('absensis')->where('karyawan_id', $kid)->where('status', 'Alpha')->count());

        $this->actingAs($admin)->post(route('admin.payroll.generate'), ['periode_bulan' => 1, 'periode_tahun' => 2026])
            ->assertSessionHasNoErrors();

        $p = Payroll::with('detailPayrolls')->where('karyawan_id', $kid)->firstOrFail();
        $pot = $p->detailPayrolls->first(fn ($d) => str_contains($d->nama_komponen_snapshot, 'Potongan Absensi'));
        $this->assertNotNull($pot, 'Potongan Alpha harus muncul di slip');
        $this->assertStringContainsString('2 Alpha', $pot->nama_komponen_snapshot);
        $this->assertEquals(round(2 * 8_800_000 / 22), $pot->nominal); // 800.000
    }
}
