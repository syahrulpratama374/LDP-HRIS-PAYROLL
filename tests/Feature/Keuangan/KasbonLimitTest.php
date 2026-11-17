<?php

namespace Tests\Feature\Keuangan;

use App\Models\AuditTrail;
use App\Models\PinjamanKaryawan;
use App\Services\KasbonLimitService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

class KasbonLimitTest extends KeuanganTestCase
{
    private function ajukan($user, array $o = [])
    {
        return $this->actingAs($user)->post(route('pinjaman.store'), array_merge([
            'jenis_kasbon' => 'Finance',
            'total_pinjaman' => 300000,
            'tenor_bulan' => 3,
            'alasan_pinjaman' => 'Keperluan mendesak',
        ], $o));
    }

    private function karyawanDenganGaji(float $gaji = 5000000): array
    {
        [$user, $kid] = $this->buatUser(6);
        $this->beriMenu(6, 'pinjaman.store');
        $this->buatGaji($kid, $gaji);

        return [$user, $kid];
    }

    public function test_pengajuan_dalam_batas_diterima_dan_tercatat_audit_trail(): void
    {
        Http::fake();
        [$user, $kid] = $this->karyawanDenganGaji();

        // 30% × 5.000.000 = 1.500.000/bln; 3.000.000 / 3 bln = 1.000.000
        $this->ajukan($user, ['total_pinjaman' => 3000000])->assertSessionHasNoErrors();

        $this->assertSame(1, PinjamanKaryawan::where('karyawan_id', $kid)->count());
        $this->assertTrue(AuditTrail::where('modul', 'Kasbon')->where('user_id', $user->id)->where('aksi', 'like', 'Pengajuan kasbon%')->exists());
    }

    public function test_cicilan_melebihi_30_persen_gaji_pokok_ditolak(): void
    {
        [$user, $kid] = $this->karyawanDenganGaji();

        // 6.000.000 / 3 = 2.000.000 > 1.500.000
        $this->ajukan($user, ['total_pinjaman' => 6000000])->assertSessionHasErrors('total_pinjaman');
        $this->assertSame(0, PinjamanKaryawan::where('karyawan_id', $kid)->count());
    }

    public function test_batas_tepat_30_persen_masih_diterima(): void
    {
        [$user] = $this->karyawanDenganGaji();

        $this->ajukan($user, ['total_pinjaman' => 4500000])->assertSessionHasNoErrors();
    }

    public function test_nominal_melebihi_plafon_per_jenis_ditolak(): void
    {
        // Plafon nominal per jenis dari Pengaturan (fitur origin/master), dicek bersama rasio gaji
        DB::table('pengaturans')->insert(['kunci' => 'maksimal_kasbon_divisi', 'nilai' => '500000', 'created_at' => now(), 'updated_at' => now()]);
        [$user, $kid] = $this->karyawanDenganGaji(10000000);

        $this->ajukan($user, ['jenis_kasbon' => 'Divisi', 'total_pinjaman' => 600000])->assertSessionHasErrors('total_pinjaman');
        $this->assertSame(0, PinjamanKaryawan::where('karyawan_id', $kid)->count());

        $this->ajukan($user, ['jenis_kasbon' => 'Divisi', 'total_pinjaman' => 500000])->assertSessionHasNoErrors();
        $this->assertSame(0.0, app(KasbonLimitService::class)->sisaLimitJenis($kid, 'Divisi'));
    }

    public function test_rasio_mengikuti_pengaturan(): void
    {
        DB::table('pengaturans')->insert(['kunci' => 'rasio_maks_cicilan_kasbon', 'nilai' => '10', 'created_at' => now(), 'updated_at' => now()]);
        [$user] = $this->karyawanDenganGaji();

        // batas 500.000/bln; 1.500.000 / 3 = 500.000 ok, 1.800.000 / 3 = 600.000 ditolak
        $this->ajukan($user, ['total_pinjaman' => 1800000])->assertSessionHasErrors('total_pinjaman');
        $this->ajukan($user, ['total_pinjaman' => 1500000])->assertSessionHasNoErrors();
    }

    public function test_maksimal_satu_kasbon_aktif_atau_pending(): void
    {
        [$user, $kid] = $this->karyawanDenganGaji();

        foreach (['Pending', 'Disetujui Atasan', 'Berjalan'] as $status) {
            PinjamanKaryawan::where('karyawan_id', $kid)->delete();
            $this->buatPinjaman($kid, ['status' => $status, 'total_pinjaman' => 30000, 'tenor_bulan' => 3]);

            $this->ajukan($user, ['total_pinjaman' => 300000])->assertSessionHasErrors('total_pinjaman');
            $this->assertSame(1, PinjamanKaryawan::where('karyawan_id', $kid)->count(), "status {$status}");
        }
    }

    public function test_kasbon_lunas_atau_ditolak_tidak_menghalangi_pengajuan_baru(): void
    {
        [$user, $kid] = $this->karyawanDenganGaji();
        $this->buatPinjaman($kid, ['status' => 'Lunas', 'sisa_pinjaman' => 0]);
        $this->buatPinjaman($kid, ['status' => 'Ditolak']);

        $this->ajukan($user)->assertSessionHasNoErrors();
        $this->assertSame(1, PinjamanKaryawan::where('karyawan_id', $kid)->where('status', 'Pending')->count());
    }

    public function test_tanpa_gaji_pokok_aktif_ditolak(): void
    {
        [$user, $kid] = $this->buatUser(6);
        $this->beriMenu(6, 'pinjaman.store');

        $this->ajukan($user)->assertSessionHasErrors('total_pinjaman');
        $this->assertSame(0, PinjamanKaryawan::where('karyawan_id', $kid)->count());
    }

    public function test_gaji_pokok_memakai_riwayat_yang_berlaku(): void
    {
        [, $kid] = $this->buatUser(6);
        DB::table('riwayat_gajis')->insert([
            ['karyawan_id' => $kid, 'nominal_gaji_pokok' => 3000000, 'effective_date_start' => '2020-01-01', 'effective_date_end' => '2024-12-31', 'created_at' => now(), 'updated_at' => now()],
            ['karyawan_id' => $kid, 'nominal_gaji_pokok' => 8000000, 'effective_date_start' => '2025-01-01', 'effective_date_end' => null, 'created_at' => now(), 'updated_at' => now()],
        ]);

        $this->assertEquals(8000000, app(KasbonLimitService::class)->gajiPokok($kid));
    }

    public function test_kasbon_divisi_tenor_dipaksa_satu_bulan(): void
    {
        [$user] = $this->karyawanDenganGaji();

        // Divisi = 1 bulan: 2.000.000 > 1.500.000 meski tenor 12 dikirim
        $this->ajukan($user, ['jenis_kasbon' => 'Divisi', 'tenor_bulan' => 12, 'total_pinjaman' => 2000000])
            ->assertSessionHasErrors('total_pinjaman');
    }

    public function test_persetujuan_finance_mengecek_ulang_limit(): void
    {
        [$admin] = $this->buatUser(1);
        [, $kid] = $this->buatUser(6);
        $this->buatGaji($kid, 1000000); // batas 300.000/bln
        $id = $this->buatPinjaman($kid, ['status' => 'Disetujui Atasan', 'total_pinjaman' => 3000000, 'tenor_bulan' => 3]);

        $this->actingAs($admin)->post(route('admin.pinjaman.update', $id), ['status' => 'Berjalan'])
            ->assertSessionHasErrors('error');
        $this->assertSame('Disetujui Atasan', PinjamanKaryawan::find($id)->status);
        $this->assertSame(0, DB::table('cicilan_pinjamans')->where('pinjaman_id', $id)->count());
    }

    public function test_persetujuan_tidak_menghitung_dirinya_sendiri_sebagai_kasbon_aktif(): void
    {
        [$admin] = $this->buatUser(1);
        [, $kid] = $this->buatUser(6);
        $this->buatGaji($kid);
        $id = $this->buatPinjaman($kid, ['status' => 'Disetujui Atasan', 'total_pinjaman' => 300000, 'tenor_bulan' => 3]);

        $this->actingAs($admin)->post(route('admin.pinjaman.update', $id), ['status' => 'Berjalan'])
            ->assertSessionHasNoErrors();
        $this->assertSame('Berjalan', PinjamanKaryawan::find($id)->status);
        $this->assertTrue(AuditTrail::where('aksi', 'like', "Ubah status kasbon #{$id}%")->exists());
    }

    public function test_notifikasi_whatsapp_terkirim_bila_api_key_dan_no_telp_ada(): void
    {
        Http::fake();
        DB::table('pengaturans')->insert(['kunci' => 'fonnte_api_key', 'nilai' => 'kunci-uji', 'created_at' => now(), 'updated_at' => now()]);
        [$user, $kid] = $this->karyawanDenganGaji();
        DB::table('karyawans')->where('id', $kid)->update(['no_telp' => '081234567890']);

        $this->ajukan($user)->assertSessionHasNoErrors();

        Http::assertSent(fn ($r) => str_contains($r->url(), 'fonnte.com') && $r['target'] === '081234567890' && str_contains($r['message'], 'kasbon'));
    }

    public function test_halaman_create_mengirim_prop_plafon(): void
    {
        [$user] = $this->karyawanDenganGaji(5000000);
        $this->beriMenu(6, 'pinjaman.create');

        $this->actingAs($user)->get(route('pinjaman.create'))
            ->assertInertia(fn ($page) => $page->component('Pinjaman/Create')
                ->where('plafon.gaji_pokok', 5000000)
                ->where('plafon.batas_cicilan', 1500000)
                ->where('plafon.sisa_plafon_cicilan', 1500000)
                ->where('plafon.kasbon_aktif', null));
    }

    public function test_gaji_pokok_fallback_ke_golongan_bila_riwayat_belum_ada(): void
    {
        DB::table('golongans')->insert([
            'id' => 1, 'kode_golongan' => 'GOL-1A', 'nama_golongan' => 'Junior Staff', 'gaji_pokok' => 4500000,
            'created_at' => now(), 'updated_at' => now(),
        ]);
        [, $kid] = $this->buatUser(6);

        $this->assertEquals(4500000, app(KasbonLimitService::class)->gajiPokok($kid));
    }
}
