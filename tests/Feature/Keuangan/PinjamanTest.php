<?php

namespace Tests\Feature\Keuangan;

use App\Models\CicilanPinjaman;
use App\Models\PinjamanKaryawan;

class PinjamanTest extends KeuanganTestCase
{
    public function test_jadwal_cicilan_jatuh_tempo_berbeda_dan_total_sama_dengan_pinjaman(): void
    {
        [$admin] = $this->buatUser(1);
        [, $kid] = $this->buatUser(6);
        $this->buatGaji($kid);
        $id = $this->buatPinjaman($kid, ['status' => 'Disetujui Atasan']);

        $this->actingAs($admin)->post(route('admin.pinjaman.update', $id), ['status' => 'Berjalan'])
            ->assertSessionHasNoErrors();

        $cicilans = CicilanPinjaman::where('pinjaman_id', $id)->orderBy('id')->get();
        $this->assertCount(3, $cicilans);
        $this->assertCount(3, $cicilans->pluck('jatuh_tempo')->map(fn ($d) => substr((string) $d, 0, 10))->unique());
        // 100.000 / 3: cicilan terakhir menampung selisih pembulatan
        $this->assertEquals(100000, $cicilans->sum('nominal_cicilan'));
        $this->assertEquals(33333, (int) $cicilans[0]->nominal_cicilan);
        $this->assertEquals(33334, (int) $cicilans[2]->nominal_cicilan);
    }

    public function test_kasbon_finance_tidak_boleh_berjalan_dari_pending(): void
    {
        [$finance] = $this->buatUser(4);
        $this->beriMenu(4, 'admin.pinjaman.update');
        [, $kid] = $this->buatUser(6);
        $id = $this->buatPinjaman($kid);

        $this->actingAs($finance)->post(route('admin.pinjaman.update', $id), ['status' => 'Berjalan'])
            ->assertSessionHasErrors('error');
        $this->assertSame('Pending', PinjamanKaryawan::find($id)->status);
    }

    public function test_pengajuan_yang_sudah_lunas_tidak_bisa_diproses_ulang(): void
    {
        [$admin] = $this->buatUser(1);
        [, $kid] = $this->buatPinjaman_user();
        $id = $this->buatPinjaman($kid, ['status' => 'Lunas', 'sisa_pinjaman' => 0]);

        $this->actingAs($admin)->post(route('admin.pinjaman.update', $id), ['status' => 'Berjalan'])
            ->assertSessionHasErrors('error');
        $this->assertSame('Lunas', PinjamanKaryawan::find($id)->status);
    }

    public function test_spv_tidak_boleh_menyetujui_kasbon_sendiri_atau_departemen_lain(): void
    {
        [$spv, $spvKid] = $this->buatUser(5, 1);
        $this->beriMenu(5, 'admin.pinjaman.update');

        $sendiri = $this->buatPinjaman($spvKid);
        $this->actingAs($spv)->post(route('admin.pinjaman.update', $sendiri), ['status' => 'Disetujui Atasan'])
            ->assertSessionHasErrors('error');

        [, $lain] = $this->buatUser(6, 2);
        $deptLain = $this->buatPinjaman($lain, ['departemen_id' => 2]);
        $this->actingAs($spv)->post(route('admin.pinjaman.update', $deptLain), ['status' => 'Disetujui Atasan'])
            ->assertSessionHasErrors('error');

        $this->assertSame('Pending', PinjamanKaryawan::find($sendiri)->status);
        $this->assertSame('Pending', PinjamanKaryawan::find($deptLain)->status);
    }

    public function test_spv_menyetujui_kasbon_bawahan_satu_departemen(): void
    {
        [$spv] = $this->buatUser(5, 1);
        $this->beriMenu(5, 'admin.pinjaman.update');
        [, $kid] = $this->buatUser(6, 1);
        $id = $this->buatPinjaman($kid);

        $this->actingAs($spv)->post(route('admin.pinjaman.update', $id), ['status' => 'Disetujui Atasan'])
            ->assertSessionHasNoErrors();
        $this->assertSame('Disetujui Atasan', PinjamanKaryawan::find($id)->status);
    }

    public function test_karyawan_tidak_bisa_upload_bukti_cicilan_orang_lain(): void
    {
        [$user] = $this->buatUser(6);
        $this->beriMenu(6, 'pinjaman.bayarManual');
        [, $lain] = $this->buatUser(6);
        $pid = $this->buatPinjaman($lain, ['status' => 'Berjalan']);
        $cid = \DB::table('cicilan_pinjamans')->insertGetId([
            'pinjaman_id' => $pid, 'nominal_cicilan' => 100000,
            'status_bayar' => 'Belum Lunas', 'created_at' => now(), 'updated_at' => now(),
        ]);

        \Storage::fake('public');
        $this->actingAs($user)->post(route('pinjaman.bayarManual', $cid), [
            'bukti_transfer' => \Illuminate\Http\UploadedFile::fake()->createWithContent('bukti.png', base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==')),
        ])->assertForbidden();
    }

    public function test_verifikasi_hanya_untuk_cicilan_menunggu_validasi_dan_tidak_dobel(): void
    {
        [$admin] = $this->buatUser(1);
        [, $kid] = $this->buatUser(6);
        $pid = $this->buatPinjaman($kid, ['status' => 'Berjalan']);
        $cid = \DB::table('cicilan_pinjamans')->insertGetId([
            'pinjaman_id' => $pid, 'nominal_cicilan' => 40000,
            'status_bayar' => 'Menunggu Validasi', 'created_at' => now(), 'updated_at' => now(),
        ]);

        $this->actingAs($admin)->post(route('admin.pinjaman.verifikasi', $cid), ['status_verifikasi' => 'Lunas'])
            ->assertSessionHasNoErrors();
        // Verifikasi kedua harus ditolak
        $this->actingAs($admin)->post(route('admin.pinjaman.verifikasi', $cid), ['status_verifikasi' => 'Lunas'])
            ->assertSessionHasErrors('error');

        $this->assertEquals(60000, PinjamanKaryawan::find($pid)->sisa_pinjaman);
    }

    public function test_pembatalan_kasbon_berjalan_menghapus_cicilan_belum_dibayar_saja(): void
    {
        [$fin] = $this->buatUser(4);
        $this->beriMenu(4, 'admin.pinjaman.update');
        [, $kid] = $this->buatUser(6);
        $pid = $this->buatPinjaman($kid, ['status' => 'Berjalan', 'sisa_pinjaman' => 200000]);
        $lunas = \DB::table('cicilan_pinjamans')->insertGetId([
            'pinjaman_id' => $pid, 'nominal_cicilan' => 100000, 'status_bayar' => 'Lunas',
            'created_at' => now(), 'updated_at' => now(),
        ]);
        foreach ([1, 2] as $i) {
            \DB::table('cicilan_pinjamans')->insert([
                'pinjaman_id' => $pid, 'nominal_cicilan' => 100000, 'status_bayar' => 'Belum Lunas',
                'jatuh_tempo' => "2026-0{$i}-25", 'created_at' => now(), 'updated_at' => now(),
            ]);
        }

        $this->actingAs($fin)->post(route('admin.pinjaman.update', $pid), ['status' => 'Ditolak'])
            ->assertSessionHasNoErrors();

        $this->assertEquals('Ditolak', PinjamanKaryawan::find($pid)->status);
        $this->assertEquals(1, CicilanPinjaman::where('pinjaman_id', $pid)->count());
        $this->assertDatabaseHas('cicilan_pinjamans', ['id' => $lunas, 'status_bayar' => 'Lunas']);
    }

    public function test_pembatalan_kasbon_berjalan_ditolak_bila_ada_cicilan_menunggu_validasi_atau_bukan_finance(): void
    {
        [$fin] = $this->buatUser(4);
        [$spv] = $this->buatUser(5);
        $this->beriMenu(4, 'admin.pinjaman.update');
        $this->beriMenu(5, 'admin.pinjaman.update');
        [, $kid] = $this->buatUser(6);
        $pid = $this->buatPinjaman($kid, ['status' => 'Berjalan']);
        \DB::table('cicilan_pinjamans')->insert([
            'pinjaman_id' => $pid, 'nominal_cicilan' => 50000, 'status_bayar' => 'Menunggu Validasi',
            'created_at' => now(), 'updated_at' => now(),
        ]);

        $this->actingAs($spv)->post(route('admin.pinjaman.update', $pid), ['status' => 'Ditolak'])
            ->assertSessionHasErrors('error');
        $this->actingAs($fin)->post(route('admin.pinjaman.update', $pid), ['status' => 'Ditolak'])
            ->assertSessionHasErrors('error');
        $this->assertEquals('Berjalan', PinjamanKaryawan::find($pid)->status);
        $this->assertEquals(1, CicilanPinjaman::where('pinjaman_id', $pid)->count());
    }

    public function test_cicilan_ditolak_verifikasi_dibawa_ke_payroll_periode_berikutnya(): void
    {
        $this->seed(\Database\Seeders\MasterTarifTerSeeder::class);
        \DB::table('master_ptkps')->insert([
            'id' => 1, 'kode_ptkp' => 'TK/0', 'nominal_neto_tahunan' => 54_000_000, 'kategori_ter' => 'A',
            'created_at' => now(), 'updated_at' => now(),
        ]);
        [$admin] = $this->buatUser(1);
        [, $kid] = $this->buatUser(6);
        $this->buatGaji($kid, 8_000_000);
        $pid = $this->buatPinjaman($kid, ['status' => 'Berjalan', 'total_pinjaman' => 100000, 'sisa_pinjaman' => 100000]);
        $cid = \DB::table('cicilan_pinjamans')->insertGetId([
            'pinjaman_id' => $pid, 'nominal_cicilan' => 100000, 'jatuh_tempo' => '2026-01-25',
            'status_bayar' => 'Menunggu Validasi', 'metode_pelunasan' => 'Tunai / Transfer',
            'bukti_transfer' => 'x.png', 'created_at' => now(), 'updated_at' => now(),
        ]);

        // Verifikasi ditolak setelah periode Januari lewat
        $this->actingAs($admin)->post(route('admin.pinjaman.verifikasi', $cid), ['status_verifikasi' => 'Ditolak'])
            ->assertSessionHasNoErrors();

        $this->actingAs($admin)->post(route('admin.payroll.generate'), ['periode_bulan' => 2, 'periode_tahun' => 2026])
            ->assertSessionHasNoErrors();

        $payroll = \App\Models\Payroll::where('karyawan_id', $kid)->where('periode_bulan', 2)->firstOrFail();
        $this->assertDatabaseHas('cicilan_pinjamans', ['id' => $cid, 'payroll_id' => $payroll->id, 'status_bayar' => 'Belum Lunas']);
        $this->assertEquals(100000, (float) \DB::table('detail_payrolls')->where('payroll_id', $payroll->id)->where('nama_komponen_snapshot', 'Cicilan Kasbon')->value('nominal'));
    }

    private function buatPinjaman_user(): array
    {
        return $this->buatUser(6);
    }
}
