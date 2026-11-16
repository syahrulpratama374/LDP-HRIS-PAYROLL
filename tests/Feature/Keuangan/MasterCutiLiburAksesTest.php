<?php

namespace Tests\Feature\Keuangan;

use Database\Seeders\MenuSeeder;
use Illuminate\Support\Facades\DB;

/**
 * Halaman Cuti Default & Hari Libur (/master-data/hc/master-cuti) memakai pemetaan menu
 * asli dari MenuSeeder: HC boleh membuka & menyimpan, role lain ditolak 403.
 */
class MasterCutiLiburAksesTest extends KeuanganTestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(MenuSeeder::class);
    }

    public function test_hc_bisa_membuka_halaman_dan_mengubah_jatah_cuti_default(): void
    {
        [$hc] = $this->buatUser(3);

        $this->actingAs($hc)->get(route('hc.cuti.index'))->assertOk();
        $this->actingAs($hc)->post(route('hc.cuti.default'), ['hak_cuti_default' => 14])
            ->assertRedirect()->assertSessionHas('success');

        $this->assertSame('14', (string) DB::table('pengaturans')->where('kunci', 'hak_cuti_default')->value('nilai'));
    }

    public function test_hc_bisa_menyimpan_dan_menghapus_hari_libur(): void
    {
        [$hc] = $this->buatUser(3);

        $this->actingAs($hc)->post(route('hc.cuti.libur.store'), [
            'tanggal' => '2026-08-17', 'keterangan' => 'HUT RI', 'is_cuti_bersama' => false,
        ])->assertRedirect()->assertSessionHas('success');

        $id = DB::table('hari_liburs')->where('tanggal', '2026-08-17')->value('id');
        $this->assertNotNull($id);
        $this->assertDatabaseCount('saldo_cutis', 0);

        $this->actingAs($hc)->delete(route('hc.cuti.libur.destroy', $id))
            ->assertRedirect()->assertSessionHas('success');
        $this->assertDatabaseMissing('hari_liburs', ['id' => $id]);
    }

    public function test_cuti_bersama_oleh_hc_memotong_saldo_karyawan_aktif(): void
    {
        [$hc, $hcKid] = $this->buatUser(3);
        [, $kid] = $this->buatUser(6);

        $this->actingAs($hc)->post(route('hc.cuti.libur.store'), [
            'tanggal' => '2026-12-24', 'keterangan' => 'Cuti Bersama Natal', 'is_cuti_bersama' => true,
        ])->assertRedirect()->assertSessionHas('success');

        foreach ([$hcKid, $kid] as $karyawanId) {
            $this->assertDatabaseHas('saldo_cutis', [
                'karyawan_id' => $karyawanId, 'tahun_periode' => 2026, 'cuti_terpakai' => 1,
            ]);
        }
    }

    public function test_role_selain_hc_ditolak_403(): void
    {
        $id = DB::table('hari_liburs')->insertGetId([
            'tanggal' => '2026-01-01', 'keterangan' => 'Tahun Baru', 'is_cuti_bersama' => false,
            'created_at' => now(), 'updated_at' => now(),
        ]);

        foreach ([2 => 'Direktur', 4 => 'Finance', 5 => 'Supervisor', 6 => 'Karyawan'] as $roleId => $nama) {
            [$user] = $this->buatUser($roleId);

            $this->actingAs($user)->get(route('hc.cuti.index'))->assertForbidden();
            $this->actingAs($user)->post(route('hc.cuti.default'), ['hak_cuti_default' => 20])->assertForbidden();
            $this->actingAs($user)->post(route('hc.cuti.libur.store'), [
                'tanggal' => '2026-05-01', 'keterangan' => "Coba {$nama}", 'is_cuti_bersama' => true,
            ])->assertForbidden();
            $this->actingAs($user)->delete(route('hc.cuti.libur.destroy', $id))->assertForbidden();
        }

        $this->assertDatabaseCount('hari_liburs', 1);
        $this->assertDatabaseCount('saldo_cutis', 0);
    }
}
