<?php

namespace Tests\Feature\Spj;

use App\Models\Spj;
use App\Services\Spj\SpjKalkulator;
use App\Support\Terbilang;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;

class PengajuanSpjTest extends SpjTestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->beriMenu(3, 'spj.index');
        $this->beriMenu(4, 'spj.index');
        $this->beriMenu(5, 'spj.index');
        $this->beriMenu(6, 'spj.index');
    }

    private function kalkulator(): SpjKalkulator
    {
        return app(SpjKalkulator::class);
    }

    public function test_contoh_dokumen_jawa_timur_staff_3_hari_3_peserta(): void
    {
        $ids = collect(['a', 'b', 'c'])->map(fn ($u) => $this->karyawanId($this->karyawanSpj("uji.$u")))->all();

        $hasil = $this->kalkulator()->hitung('Jawa Timur', '2026-08-27', '2026-08-29', $this->kalkulator()->muatKaryawan($ids));

        $this->assertSame(3, $hasil['hari']);
        $this->assertSame(2, $hasil['malam']);
        foreach ($hasil['peserta'] as $p) {
            $this->assertEquals(164000, $p['tarif_uang_harian']);
            $this->assertEquals(492000, $p['total_uang_harian']);
            $this->assertEquals(392000, $p['batas_penginapan']); // 196.000 x 2 malam
        }
        $this->assertEquals(1476000, $hasil['total_uang_harian']);
        $this->assertSame('Satu Juta Empat Ratus Tujuh Puluh Enam Ribu Rupiah', $hasil['terbilang']);
    }

    public function test_head_berjenjang_mgr_dengan_kategori_staff_memakai_tarif_staff(): void
    {
        $fahla = $this->karyawanSpj('fahla', 5, $this->jabatanManager, 'Staff');
        $manager = $this->karyawanSpj('yoga', 3, $this->jabatanManager, 'Manager');

        $hasil = $this->kalkulator()->hitung('Jawa Timur', '2026-08-27', '2026-08-29',
            $this->kalkulator()->muatKaryawan([$this->karyawanId($fahla), $this->karyawanId($manager)]));

        $this->assertEquals(164000, $hasil['peserta'][0]['tarif_uang_harian']); // Staff, bukan 205.000
        $this->assertEquals(205000, $hasil['peserta'][1]['tarif_uang_harian']);
        $this->assertEquals(280000 * 2, $hasil['peserta'][1]['batas_penginapan']);
    }

    public function test_jumlah_hari_satu_hari_dan_terbilang(): void
    {
        $id = $this->karyawanId($this->karyawanSpj('uji.a'));
        $hasil = $this->kalkulator()->hitung('Jawa Timur', '2026-08-27', '2026-08-27', $this->kalkulator()->muatKaryawan([$id]));

        $this->assertSame(1, $hasil['hari']);
        $this->assertSame(0, $hasil['malam']);
        $this->assertEquals(0, $hasil['peserta'][0]['batas_penginapan']);
        $this->assertSame('Seratus Enam Puluh Empat Ribu Rupiah', Terbilang::rupiah(164000));
        $this->assertSame('Seribu Seratus Rupiah', Terbilang::rupiah(1100));
    }

    public function test_simpan_draf_lalu_ajukan_dengan_snapshot(): void
    {
        $pengaju = $this->karyawanSpj('staff.cre1');
        $fahla = $this->karyawanSpj('fahla', 5, $this->jabatanManager);
        $this->beriRekening($pengaju, '9990000002');
        $this->beriRekening($fahla, '9990000001');
        $ids = [$this->karyawanId($fahla), $this->karyawanId($pengaju)];

        $this->actingAs($pengaju)->post(route('spj.store'), $this->formSpj($ids))->assertSessionHasNoErrors();
        $spj = Spj::with('pesertas')->sole();
        $this->assertSame('Draft', $spj->status);
        $this->assertSame([3, 2], [$spj->jumlah_hari, $spj->jumlah_malam]);
        $this->assertEquals(984000, $spj->total_uang_harian);
        $this->assertSame($ids, $spj->pesertas->pluck('karyawan_id')->all()); // urutan dipertahankan
        $this->assertSame('9990000001', Crypt::decryptString($spj->pesertas[0]->rekening_encrypted));
        $this->assertSame('LDP-HC', $spj->unitPenerbit->kode);

        $this->actingAs($pengaju)->post(route('spj.ajukan', $spj))->assertSessionHasNoErrors()->assertRedirect(route('spj.index'));
        $spj->refresh();
        $this->assertSame('Diajukan', $spj->status);
        $this->assertNotNull($spj->diajukan_pada);

        // Setelah diajukan tidak bisa diubah/dihapus
        $this->actingAs($pengaju)->put(route('spj.update', $spj), $this->formSpj($ids))->assertForbidden();
        $this->actingAs($pengaju)->delete(route('spj.destroy', $spj))->assertForbidden();
    }

    public function test_ajukan_ditolak_bila_ada_peserta_tanpa_rekening(): void
    {
        $pengaju = $this->karyawanSpj('staff.cre1');
        $fahla = $this->karyawanSpj('fahla', 5, $this->jabatanManager);
        $this->beriRekening($pengaju);
        $ids = [$this->karyawanId($fahla), $this->karyawanId($pengaju)];

        // Langsung "Ajukan" dari form: draf tetap tersimpan, pengajuan ditolak dengan pesan jelas
        $this->actingAs($pengaju)->post(route('spj.store'), $this->formSpj($ids, ['aksi' => 'ajukan']))
            ->assertSessionHasErrors('ajukan');
        $pesan = session('errors')->first('ajukan');
        $this->assertStringContainsString('belum punya nomor rekening', $pesan);
        $this->assertStringContainsString($fahla->karyawan->nama_lengkap, $pesan);
        $this->assertStringNotContainsString($pengaju->karyawan->nama_lengkap, $pesan);
        $spj = Spj::sole();
        $this->assertSame('Draft', $spj->status);

        $this->actingAs($pengaju)->post(route('spj.ajukan', $spj))->assertSessionHasErrors('ajukan');
        $this->assertSame('Draft', $spj->fresh()->status);

        // Setelah rekening dilengkapi, bisa diajukan (snapshot rekening diperbarui saat ajukan)
        $this->beriRekening($fahla, '9990000001');
        $this->actingAs($pengaju)->post(route('spj.ajukan', $spj))->assertSessionHasNoErrors();
        $this->assertSame('Diajukan', $spj->fresh()->status);
    }

    public function test_validasi_provinsi_tanpa_uang_harian_dan_peserta(): void
    {
        $pengaju = $this->karyawanSpj('staff.cre1');
        $id = $this->karyawanId($pengaju);

        $this->actingAs($pengaju)->post(route('spj.store'), $this->formSpj([$id], ['provinsi' => 'Nusa Tenggara Barat']))
            ->assertSessionHasErrors('provinsi');
        $this->actingAs($pengaju)->post(route('spj.store'), $this->formSpj([]))->assertSessionHasErrors('peserta');
        $this->actingAs($pengaju)->post(route('spj.store'), $this->formSpj([$id, $id]))->assertSessionHasErrors('peserta.1');
        $this->actingAs($pengaju)->post(route('spj.store'), $this->formSpj([$id], ['tgl_pulang' => '2026-08-26']))
            ->assertSessionHasErrors('tgl_pulang');
        $this->assertSame(0, Spj::count());
    }

    public function test_hitung_rekening_lengkap_untuk_pemilik_dan_hc_finance_admin_lainnya_disamarkan(): void
    {
        $staff = $this->karyawanSpj('staff.cre1');
        $fahla = $this->karyawanSpj('fahla', 5, $this->jabatanManager);
        $orangLain = $this->karyawanSpj('staff.sls1');
        $this->beriRekening($staff, '9990000002');
        $this->beriRekening($fahla, '9990000001');
        $payload = ['provinsi' => 'Jawa Timur', 'tgl_berangkat' => '2026-08-27', 'tgl_pulang' => '2026-08-29',
            'peserta' => [$this->karyawanId($staff), $this->karyawanId($fahla)]];

        // Peserta: rekening sendiri lengkap, rekening peserta lain disamarkan
        $this->actingAs($staff)->postJson(route('spj.hitung'), $payload)->assertOk()
            ->assertJsonPath('peserta.0.rekening', '9990000002')
            ->assertJsonPath('peserta.1.rekening', '****0001')
            ->assertJsonPath('peserta.0.punya_rekening', true)
            ->assertJsonPath('total_uang_harian', 984000)
            ->assertJsonPath('terbilang', 'Sembilan Ratus Delapan Puluh Empat Ribu Rupiah');
        $this->actingAs($fahla)->postJson(route('spj.hitung'), $payload)
            ->assertJsonPath('peserta.0.rekening', '****0002')
            ->assertJsonPath('peserta.1.rekening', '9990000001');

        // Bukan pemilik & bukan HC/Finance/Admin: semua disamarkan
        $this->actingAs($orangLain)->postJson(route('spj.hitung'), $payload)
            ->assertJsonPath('peserta.0.rekening', '****0002')
            ->assertJsonPath('peserta.1.rekening', '****0001');

        foreach ([$this->buatUser(3), $this->buatUser(4), $this->admin()] as $penuh) {
            $this->actingAs($penuh)->postJson(route('spj.hitung'), $payload)
                ->assertJsonPath('peserta.0.rekening', '9990000002')
                ->assertJsonPath('peserta.1.rekening', '9990000001');
        }
    }

    public function test_form_menyediakan_provinsi_unit_default_dan_rekening_sesuai_pemilik(): void
    {
        $staff = $this->karyawanSpj('staff.cre1');
        $fahla = $this->karyawanSpj('fahla', 5, $this->jabatanManager);
        $this->beriRekening($staff, '9990000002');
        $this->beriRekening($fahla, '9990000001');

        $this->actingAs($staff)->get(route('spj.create'))->assertOk()
            ->assertInertia(fn ($p) => $p->component('PerjalananDinas/Form')
                ->where('defaultUnitPenerbitId', $this->unit('LDP-HC')->id)
                ->has('provinsiList', 17)
                ->where('karyawans', function ($ks) use ($staff, $fahla) {
                    $ks = collect($ks);

                    return $ks->firstWhere('id', $this->karyawanId($staff))['rekening'] === '9990000002'
                        && $ks->firstWhere('id', $this->karyawanId($fahla))['rekening'] === '****0001'
                        && $ks->every(fn ($k) => ! array_key_exists('no_rek_bca_encrypted', $k));
                }));
    }

    public function test_daftar_menampilkan_spj_sendiri_atau_sebagai_peserta_hc_melihat_semua(): void
    {
        $pengaju = $this->karyawanSpj('staff.cre1');
        $peserta = $this->karyawanSpj('fahla', 5, $this->jabatanManager);
        $orangLain = $this->karyawanSpj('staff.sls1');
        $this->actingAs($pengaju)->post(route('spj.store'), $this->formSpj([$this->karyawanId($peserta)]));

        $jumlah = fn ($user) => $this->actingAs($user)->get(route('spj.index'))->assertOk()
            ->viewData('page')['props']['spjs']['total'];

        $this->assertSame(1, $jumlah($pengaju));  // pembuat (meski bukan peserta)
        $this->assertSame(1, $jumlah($peserta));  // peserta
        $this->assertSame(0, $jumlah($orangLain));
        $this->assertSame(1, $jumlah($this->buatUser(3)));  // HC
        $this->assertSame(1, $jumlah($this->buatUser(4)));  // Finance
        $this->assertSame(1, $jumlah($this->admin()));
    }

    public function test_hanya_pembuat_yang_bisa_mengubah_atau_menghapus_draf(): void
    {
        $pengaju = $this->karyawanSpj('staff.cre1');
        $peserta = $this->karyawanSpj('fahla', 5, $this->jabatanManager);
        $this->actingAs($pengaju)->post(route('spj.store'), $this->formSpj([$this->karyawanId($peserta)]));
        $spj = Spj::sole();

        $this->actingAs($peserta)->get(route('spj.edit', $spj))->assertForbidden();
        $this->actingAs($peserta)->put(route('spj.update', $spj), $this->formSpj([$this->karyawanId($peserta)]))->assertForbidden();
        $this->actingAs($this->buatUser(3))->delete(route('spj.destroy', $spj))->assertForbidden();

        $this->actingAs($pengaju)->get(route('spj.edit', $spj))->assertOk()
            ->assertInertia(fn ($p) => $p->where('spj.peserta', [$this->karyawanId($peserta)]));
        $this->actingAs($pengaju)->delete(route('spj.destroy', $spj))->assertRedirect(route('spj.index'));
        $this->assertSame(0, Spj::count());
        $this->assertSame(0, DB::table('spj_pesertas')->count());
    }

    public function test_form_spj_lama_tetap_bisa_dibuka_lewat_url(): void
    {
        $karyawan = $this->karyawanSpj('staff.cre1');

        $this->actingAs($karyawan)->get('/spj')->assertOk()->assertInertia(fn ($p) => $p->component('Spj/Index'));
        $this->actingAs($karyawan)->get('/spj/ajukan')->assertOk()->assertInertia(fn ($p) => $p->component('Spj/Create'));
        $this->assertSame(url('/perjalanan-dinas'), route('spj.index'));
    }
}
