<?php

namespace Tests\Feature\Persuratan;

use App\Models\NomorSuratTerbit;
use App\Models\PenomoranSurat;
use App\Models\SuratKeluar;
use App\Services\PenomoranSuratService;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PenomoranSuratTest extends PersuratanTestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        Carbon::setTestNow('2026-11-19 10:00:00');
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    private function svc(): PenomoranSuratService
    {
        return app(PenomoranSuratService::class);
    }

    public function test_format_nomor_huruf_besar_dan_bulan_tahun_dari_waktu_terbit(): void
    {
        $pembuat = $this->buatUser(6);
        $surat = $this->buatDraf($pembuat, 'skep'); // kode tersimpan huruf kecil

        $this->assertSame('001/SKEP/LDP-HC/XI/2026', $this->setujui($surat));

        $surat->refresh();
        $this->assertSame('Terbit', $surat->status);
        $this->assertStringStartsWith('2026-11-19', (string) $surat->tanggal_terbit);
        $this->assertDatabaseHas('nomor_surat_terbits', [
            'nomor' => '001/SKEP/LDP-HC/XI/2026', 'sumber_type' => SuratKeluar::class, 'sumber_id' => $surat->id,
        ]);
    }

    public function test_mode_global_satu_urutan_lintas_jenis_dan_penerbit_lalu_reset_tahun_baru(): void
    {
        $pembuat = $this->buatUser(6);

        $this->assertSame('001/SKET/LDP-HC/XI/2026', $this->setujui($this->buatDraf($pembuat, 'SKET')));
        $this->assertSame('002/STU/LDP-FIN/XI/2026', $this->setujui($this->buatDraf($pembuat, 'STU', 'LDP-FIN')));
        $this->assertSame('003/SKET/LDP-HC/XI/2026', $this->setujui($this->buatDraf($pembuat, 'SKET')));

        Carbon::setTestNow('2027-01-02 08:00:00');
        $this->assertSame('001/SKET/LDP-HC/I/2027', $this->setujui($this->buatDraf($pembuat, 'SKET')));
    }

    public function test_mode_per_penerbit_menghasilkan_urutan_terpisah_per_kode_penerbit(): void
    {
        $this->setMode('per_penerbit');
        $pembuat = $this->buatUser(6);

        $this->assertSame('001/SKET/LDP-HC/XI/2026', $this->setujui($this->buatDraf($pembuat, 'SKET')));
        $this->assertSame('001/SKET/LDP-FIN/XI/2026', $this->setujui($this->buatDraf($pembuat, 'SKET', 'LDP-FIN')));
        $this->assertSame('002/STU/LDP-HC/XI/2026', $this->setujui($this->buatDraf($pembuat, 'STU')));
        $this->assertSame('002/SKET/LDP-FIN/XI/2026', $this->setujui($this->buatDraf($pembuat, 'SKET', 'LDP-FIN')));
    }

    public function test_mode_per_jenis_menghasilkan_urutan_terpisah_per_jenis(): void
    {
        $this->setMode('per_jenis');

        $this->assertSame('001/SKET/LDP-HC/XI/2026', $this->svc()->terbitkan('SKET', 'LDP-HC'));
        $this->assertSame('001/STU/LDP-HC/XI/2026', $this->svc()->terbitkan('STU', 'LDP-HC'));
        $this->assertSame('002/SKET/LDP-FIN/XI/2026', $this->svc()->terbitkan('sket', 'ldp-fin'));
    }

    public function test_ganti_mode_tidak_merusak_nomor_lama_dan_tidak_menghasilkan_nomor_ganda(): void
    {
        $pembuat = $this->buatUser(6);
        $s1 = $this->buatDraf($pembuat, 'SKET');
        $s2 = $this->buatDraf($pembuat, 'SKET', 'LDP-FIN');
        $s3 = $this->buatDraf($pembuat, 'SKET');
        $this->assertSame('001/SKET/LDP-HC/XI/2026', $this->setujui($s1));
        $this->assertSame('002/SKET/LDP-FIN/XI/2026', $this->setujui($s2));
        $this->assertSame('003/SKET/LDP-HC/XI/2026', $this->setujui($s3));

        // Ke per_penerbit: penghitung baru melanjutkan dari nomor terbesar penerbit itu, bukan dari 001
        $this->setMode('per_penerbit');
        $this->assertSame('004/SKET/LDP-HC/XI/2026', $this->svc()->terbitkan('SKET', 'LDP-HC'));
        $this->assertSame('003/SKET/LDP-FIN/XI/2026', $this->svc()->terbitkan('SKET', 'LDP-FIN'));

        // Kembali ke global: melanjutkan dari urutan terbesar tahun itu
        $this->setMode('global');
        $this->assertSame('005/SKET/LDP-HC/XI/2026', $this->svc()->terbitkan('SKET', 'LDP-HC'));

        // Nomor yang sudah terbit tidak berubah
        $this->assertSame('001/SKET/LDP-HC/XI/2026', $s1->fresh()->nomor_surat);
        $this->assertSame('002/SKET/LDP-FIN/XI/2026', $s2->fresh()->nomor_surat);
        $this->assertSame('003/SKET/LDP-HC/XI/2026', $s3->fresh()->nomor_surat);
        $this->assertSame(
            NomorSuratTerbit::count(),
            NomorSuratTerbit::distinct()->count('nomor'),
        );
    }

    public function test_mode_tidak_dikenal_jatuh_ke_global(): void
    {
        $this->setMode('acak');
        Log::spy();

        $this->assertSame(PenomoranSuratService::MODE_GLOBAL, $this->svc()->mode());
        Log::shouldHaveReceived('warning')->once();
    }

    public function test_terbitkan_menolak_kode_dengan_garis_miring(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->svc()->terbitkan('SK/X', 'LDP-HC');
    }

    public function test_penghitung_melanjutkan_dari_hasil_backfill(): void
    {
        $pembuat = $this->buatUser(6);
        $templateId = $this->buatTemplate('SKK');
        DB::table('surat_keluars')->insert([
            ['template_id' => $templateId, 'created_by' => $pembuat->id, 'nomor_surat' => '007/skk/ldp-hc/X/2026',
                'status' => 'Terbit', 'status_approval' => 'Disetujui', 'tanggal_terbit' => '2026-10-01'],
            ['template_id' => $templateId, 'created_by' => $pembuat->id, 'nomor_surat' => 'NOMOR-ANEH',
                'status' => 'Terbit', 'status_approval' => 'Disetujui', 'tanggal_terbit' => '2026-10-02'],
        ]);

        $backfill = require database_path('migrations/2026_11_19_100300_backfill_penomoran_surats.php');
        $backfill->up();
        $backfill->up(); // idempoten

        $this->assertSame(7, PenomoranSurat::where('kunci', '2026')->value('nomor_terakhir'));
        $this->assertDatabaseHas('nomor_surat_terbits', ['nomor' => '007/skk/ldp-hc/X/2026', 'kode_jenis' => 'SKK', 'kode_penerbit' => 'LDP-HC', 'urut' => 7]);
        $this->assertSame(1, NomorSuratTerbit::count()); // format aneh dilewati

        $this->assertSame('008/SKET/LDP-HC/XI/2026', $this->setujui($this->buatDraf($pembuat, 'SKET')));
    }

    public function test_dua_persetujuan_terakhir_berurutan_tidak_menghasilkan_nomor_ganda(): void
    {
        $pembuat = $this->buatUser(6);
        $a = $this->buatDraf($pembuat, 'SKET');
        $b = $this->buatDraf($pembuat, 'SKET');

        $nomorA = $this->setujui($a);
        $nomorB = $this->setujui($b);

        $this->assertSame('001/SKET/LDP-HC/XI/2026', $nomorA);
        $this->assertSame('002/SKET/LDP-HC/XI/2026', $nomorB);
        $this->assertSame(2, PenomoranSurat::where('kunci', '2026')->value('nomor_terakhir'));
    }

    public function test_approve_ulang_surat_terbit_tidak_mengubah_nomor_dan_tidak_menghabiskan_urutan(): void
    {
        $surat = $this->buatDraf($this->buatUser(6), 'SKET');
        $nomor = $this->setujui($surat);

        $this->actingAs($this->ceo())
            ->post(route('keluar.approve', $surat->id), ['jenis_ttd' => 'qr_code'])
            ->assertSessionHas('error');

        $this->assertSame($nomor, $surat->fresh()->nomor_surat);
        $this->assertSame(1, PenomoranSurat::where('kunci', '2026')->value('nomor_terakhir'));
        $this->assertSame(1, NomorSuratTerbit::count());
    }

    public function test_approval_bertahap_hanya_menerbitkan_nomor_di_tahap_terakhir(): void
    {
        $direktur = $this->ceo();
        $surat = $this->buatDraf($this->buatUser(6), 'SKET');
        DB::table('approval_surat_keluars')->insert([
            'surat_keluar_id' => $surat->id, 'urutan_langkah' => 2,
            'jabatan_id' => $this->jabatanDirut, 'label_ttd' => 'Mengetahui', 'status' => 'Menunggu',
            'created_at' => now(), 'updated_at' => now(),
        ]);

        $this->assertNull($this->setujui($surat, $direktur));
        $this->assertSame('Draft', $surat->fresh()->status);
        $this->assertSame(0, NomorSuratTerbit::count());

        $this->assertSame('001/SKET/LDP-HC/XI/2026', $this->setujui($surat, $direktur));
    }

    public function test_surat_terbit_tidak_bisa_diedit_diupdate_atau_dihapus(): void
    {
        $pembuat = $this->buatUser(6);
        $surat = $this->buatDraf($pembuat, 'SKET');
        $nomor = $this->setujui($surat);

        $this->actingAs($pembuat)->get(route('keluar.edit', $surat->id))->assertForbidden();
        $this->actingAs($pembuat)->put(route('keluar.update', $surat->id), [
            'unit_penerbit_id' => $this->unit('LDP-FIN')->id,
            'isi_surat_final' => '<p>ubah</p>',
        ])->assertForbidden();
        $this->actingAs($pembuat)->delete(route('keluar.destroy', $surat->id))->assertForbidden();

        $surat->refresh();
        $this->assertSame($nomor, $surat->nomor_surat);
        $this->assertSame($this->unit('LDP-HC')->id, $surat->unit_penerbit_id);
        $this->assertSame('<p>isi</p>', $surat->isi_surat_final);
    }

    public function test_create_mengirim_default_penerbit_sesuai_departemen_pembuat(): void
    {
        $this->actingAs($this->buatUser(6, $this->deptHc))->get(route('keluar.create'))
            ->assertInertia(fn ($p) => $p->where('defaultUnitPenerbitId', $this->unit('LDP-HC')->id)
                ->has('unitPenerbits', 3));

        // Departemen tanpa unit & Admin tanpa karyawan: kosong, wajib pilih manual
        $this->actingAs($this->buatUser(6, $this->deptSls))->get(route('keluar.create'))
            ->assertInertia(fn ($p) => $p->where('defaultUnitPenerbitId', null));
        $this->actingAs($this->admin())->get(route('keluar.create'))
            ->assertInertia(fn ($p) => $p->where('defaultUnitPenerbitId', null));
    }

    public function test_store_wajib_penerbit_aktif_dan_menerima_penerbit_pengganti(): void
    {
        $pembuat = $this->buatUser(6);
        $templateId = $this->buatTemplate('SKET');
        $nonaktif = $this->buatUnit('LDP-OLD', 'Lama', null, false);
        $payload = ['template_id' => $templateId, 'isi_surat_final' => '<p>isi</p>'];

        $this->actingAs($pembuat)->post(route('keluar.store'), $payload)->assertSessionHasErrors('unit_penerbit_id');
        $this->actingAs($pembuat)->post(route('keluar.store'), $payload + ['unit_penerbit_id' => 9999])->assertSessionHasErrors('unit_penerbit_id');
        $this->actingAs($pembuat)->post(route('keluar.store'), $payload + ['unit_penerbit_id' => $nonaktif->id])->assertSessionHasErrors('unit_penerbit_id');

        $this->actingAs($pembuat)->post(route('keluar.store'), $payload + ['unit_penerbit_id' => $this->unit('LDP-FIN')->id])
            ->assertSessionHasNoErrors()->assertRedirect(route('keluar.index'));
        $this->assertSame($this->unit('LDP-FIN')->id, SuratKeluar::latest('id')->value('unit_penerbit_id'));
    }

    public function test_update_bisa_mengganti_penerbit_sebelum_terbit(): void
    {
        $pembuat = $this->buatUser(6);
        $surat = $this->buatDraf($pembuat, 'SKET');

        $this->actingAs($pembuat)->put(route('keluar.update', $surat->id), [
            'unit_penerbit_id' => $this->unit('LDP-FIN')->id,
            'isi_surat_final' => '<p>revisi</p>',
        ])->assertSessionHasNoErrors();

        $this->assertSame('001/SKET/LDP-FIN/XI/2026', $this->setujui($surat));
    }

    public function test_draf_lama_tanpa_penerbit_memakai_unit_departemen_lalu_ldp_corp_dengan_log(): void
    {
        Log::spy();

        $drafHc = $this->buatDraf($this->buatUser(6, $this->deptHc), 'SKET', null);
        $this->assertSame('001/SKET/LDP-HC/XI/2026', $this->setujui($drafHc));
        $this->assertSame($this->unit('LDP-HC')->id, $drafHc->fresh()->unit_penerbit_id);

        $drafSls = $this->buatDraf($this->buatUser(6, $this->deptSls), 'SKET', null);
        $this->assertSame('002/SKET/LDP-CORP/XI/2026', $this->setujui($drafSls));
        $this->assertSame($this->unit('LDP-CORP')->id, $drafSls->fresh()->unit_penerbit_id);

        Log::shouldHaveReceived('warning')->withArgs(fn ($m) => str_contains($m, 'LDP-CORP'))->once();
    }

    public function test_template_menolak_kode_bergaris_miring_dan_tidak_wajib_pembuat_kode(): void
    {
        $admin = $this->admin();
        $data = ['nama_template' => 'Surat Edaran', 'konten' => '<p>x</p>'];

        $this->actingAs($admin)->post(route('template.store'), $data + ['kode_surat' => 'SE/1'])
            ->assertSessionHasErrors('kode_surat');

        $this->actingAs($admin)->post(route('template.store'), $data + ['kode_surat' => 'se'])
            ->assertSessionHasNoErrors();
        $this->assertDatabaseHas('master_template_surats', ['nama_template' => 'Surat Edaran', 'kode_surat' => 'SE']);
    }
}
