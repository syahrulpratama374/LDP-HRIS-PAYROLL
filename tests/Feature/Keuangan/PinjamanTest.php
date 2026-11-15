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

    private function buatPinjaman_user(): array
    {
        return $this->buatUser(6);
    }
}
