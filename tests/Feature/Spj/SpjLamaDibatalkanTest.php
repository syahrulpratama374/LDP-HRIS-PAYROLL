<?php

namespace Tests\Feature\Spj;

use Database\Seeders\MasterTarifTerSeeder;
use Illuminate\Support\Facades\DB;
use Tests\Feature\Keuangan\KeuanganTestCase;

/** Pembatalan dua SPJ model lama (data uji staff.hc1) agar tidak ikut cair di payroll November. */
class SpjLamaDibatalkanTest extends KeuanganTestCase
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

    private function spjLama(int $id, int $karyawanId, string $mulai, string $selesai, int $total, string $status): void
    {
        DB::table('pengajuan_spjs')->insert([
            'id' => $id, 'karyawan_id' => $karyawanId, 'tujuan' => 'Surabaya', 'keperluan' => 'Uji',
            'tgl_mulai' => $mulai, 'tgl_selesai' => $selesai, 'total_biaya' => $total,
            'status_approval' => $status, 'sudah_dibayar' => false, 'created_at' => now(), 'updated_at' => now(),
        ]);
    }

    private function pencairanSpj(int $karyawanId): ?string
    {
        return DB::table('detail_payrolls')
            ->join('payrolls', 'payrolls.id', '=', 'detail_payrolls.payroll_id')
            ->where('payrolls.karyawan_id', $karyawanId)
            ->where('nama_komponen_snapshot', 'Pencairan SPJ')
            ->value('nominal');
    }

    public function test_spj_lama_data_uji_dibatalkan_tidak_masuk_payroll_dan_bisa_dibalik(): void
    {
        [$staffHc, $kid] = $this->buatUser(6);
        $staffHc->update(['username' => 'staff.hc1']);
        [, $kidLain] = $this->buatUser(6);
        $this->buatGaji($kid, 5_000_000);
        $this->buatGaji($kidLain, 5_000_000);

        $this->spjLama(1, $kid, '2026-11-18', '2026-11-20', 500000, 'Selesai');
        $this->spjLama(2, $kid, '2026-11-19', '2026-11-21', 400000, 'Pending');
        $this->spjLama(3, $kidLain, '2026-11-10', '2026-11-11', 300000, 'Selesai'); // bukan target

        $migrasi = require database_path('migrations/2026_11_21_100400_batalkan_spj_lama_data_uji.php');
        $migrasi->up();
        $migrasi->up(); // aman diulang

        $status = fn (int $id) => DB::table('pengajuan_spjs')->where('id', $id)->value('status_approval');
        $this->assertSame('Ditolak', $status(1));
        $this->assertSame('Ditolak', $status(2));
        $this->assertSame('Selesai', $status(3));

        $admin = $this->buatUser(1)[0];
        $this->actingAs($admin)->post(route('admin.payroll.generate'), ['periode_bulan' => 11, 'periode_tahun' => 2026])
            ->assertSessionHasNoErrors();

        $this->assertNull($this->pencairanSpj($kid));          // SPJ batal tidak dicairkan
        $this->assertEquals(300000, $this->pencairanSpj($kidLain)); // SPJ lama lain tetap jalan seperti biasa
        $this->assertNull(DB::table('pengajuan_spjs')->where('id', 1)->value('payroll_id'));

        $migrasi->down();
        $this->assertSame('Selesai', $status(1));
        $this->assertSame('Pending', $status(2));
    }
}
