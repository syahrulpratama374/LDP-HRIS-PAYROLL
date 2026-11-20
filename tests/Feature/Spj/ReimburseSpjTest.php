<?php

namespace Tests\Feature\Spj;

use App\Models\Spj;
use App\Models\SpjBiaya;
use App\Models\SpjPeserta;
use App\Models\SpjSelisihPenginapan;
use App\Models\User;
use App\Services\Spj\SpjPdfService;
use Database\Seeders\MasterTemplateSuratSeeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

/** B6 — nota & reimburse, batas penginapan per total peserta, selisih, rekap, dashboard, PDF akomodasi. */
class ReimburseSpjTest extends SpjTestCase
{
    private User $pengaju;

    private User $fahla;

    private User $yoga;

    private User $muslih;

    private User $ceoUser;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('local');
        Carbon::setTestNow('2026-11-20 09:00:00');
        $this->seed(MasterTemplateSuratSeeder::class);
        foreach ([2, 3, 4, 5, 6] as $role) {
            $this->beriMenu($role, 'spj.index');
        }
        $this->pengaju = $this->karyawanSpj('staff.cre1', 6, $this->jabatanStaf, 'Staff', $this->deptSls);
        $this->fahla = $this->karyawanSpj('fahla', 5, $this->jabatanManager, 'Staff', $this->deptSls);
        $this->yoga = $this->karyawanSpj('yoga', 3, $this->jabatanManager, 'Manager', $this->deptHc);
        $this->muslih = $this->karyawanSpj('muslih', 4, $this->jabatanManager, 'Manager');
        $this->ceoUser = $this->karyawanSpj('ceo', 2, $this->jabatanDirut, 'Direksi', $this->deptBod);
        $this->beriRekening($this->pengaju, '9990000002');
        $this->beriRekening($this->fahla, '9990000001');
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    /** SPJ Jawa Timur 27-29 Nov 2026 (3 hari, 2 malam), peserta fahla & staff.cre1, sudah Disetujui. */
    private function spjDisetujui(): Spj
    {
        $spj = $this->spjDiajukan();
        foreach ([$this->yoga, $this->muslih, $this->ceoUser] as $u) {
            $this->actingAs($u)->post(route('spj.approve', $spj), ['jenis_ttd' => 'qr_code'])->assertSessionHasNoErrors();
        }

        return $spj->fresh();
    }

    private function spjDiajukan(): Spj
    {
        $peserta = [$this->karyawanId($this->fahla), $this->karyawanId($this->pengaju)];
        $this->actingAs($this->pengaju)->post(route('spj.store'), $this->formSpj($peserta, [
            'tgl_berangkat' => '2026-11-27', 'tgl_pulang' => '2026-11-29', 'aksi' => 'ajukan',
        ]))->assertSessionHasNoErrors();

        return Spj::latest('id')->first();
    }

    private function peserta(Spj $spj, User $user): SpjPeserta
    {
        return SpjPeserta::where('spj_id', $spj->id)->where('karyawan_id', $this->karyawanId($user))->firstOrFail();
    }

    private function unggah(User $oleh, Spj $spj, SpjPeserta $p, string $jenis, float $nominal, array $ubah = [])
    {
        return $this->actingAs($oleh)->post(route('spj.nota.store', $spj), array_merge([
            'spj_peserta_id' => $p->id, 'jenis' => $jenis, 'tanggal' => '2026-11-27',
            'jumlah_malam' => $jenis === 'penginapan' ? 1 : null, 'nominal_nota' => $nominal,
            'keterangan' => 'Nota uji', 'file_nota' => UploadedFile::fake()->create('nota.pdf', 100, 'application/pdf'),
        ], $ubah));
    }

    private function notaTerakhir(): SpjBiaya
    {
        return SpjBiaya::latest('id')->first();
    }

    private function validasi(SpjBiaya $b, ?User $oleh = null, array $data = [])
    {
        return $this->actingAs($oleh ?? $this->muslih)->post(route('spj.nota.validasi', $b), $data);
    }

    public function test_penginapan_dibayar_min_nota_dan_sisa_batas_untuk_total_per_peserta(): void
    {
        $spj = $this->spjDisetujui();
        $fahla = $this->peserta($spj, $this->fahla);
        $staf = $this->peserta($spj, $this->pengaju);
        $tarif = (float) $fahla->tarif_penginapan;
        $batas = (float) $fahla->batas_penginapan;
        $this->assertEquals($tarif * 2, $batas); // 2 malam

        // Nota 1 malam pertama: di bawah batas -> dibayar penuh
        $nota1 = $batas - 100_000;
        $this->unggah($this->fahla, $spj, $fahla, 'penginapan', $nota1)->assertSessionHasNoErrors();
        $this->validasi($this->notaTerakhir())->assertSessionHasNoErrors();
        $this->assertEquals($nota1, $this->notaTerakhir()->nominal_dibayar);

        // Nota 2: sisa batas hanya 100.000 -> dibayar 100.000, kelebihan ditanggung peserta
        $this->unggah($this->fahla, $spj, $fahla, 'penginapan', 250_000)->assertSessionHasNoErrors();
        $this->validasi($this->notaTerakhir())->assertSessionHasNoErrors();
        $b2 = $this->notaTerakhir();
        $this->assertEquals(100_000, $b2->nominal_dibayar);
        $this->assertStringContainsString('ditanggung peserta', $b2->catatan);

        // Nota 3: batas habis -> dibayar 0
        $this->unggah($this->fahla, $spj, $fahla, 'penginapan', 50_000)->assertSessionHasNoErrors();
        $this->validasi($this->notaTerakhir())->assertSessionHasNoErrors();
        $this->assertEquals(0, $this->notaTerakhir()->nominal_dibayar);

        // Total penginapan fahla tidak pernah melebihi batas
        $this->assertEquals($batas, SpjBiaya::where('spj_peserta_id', $fahla->id)->sum('nominal_dibayar'));

        // Batas berlaku per peserta: peserta lain tetap punya batas penuh
        $this->unggah($this->pengaju, $spj, $staf, 'penginapan', $batas + 500_000, ['jumlah_malam' => 2])->assertSessionHasNoErrors();
        $this->validasi($this->notaTerakhir())->assertSessionHasNoErrors();
        $this->assertEquals($batas, $this->notaTerakhir()->nominal_dibayar);
    }

    public function test_tiket_transport_lainnya_dibayar_sesuai_nota(): void
    {
        $spj = $this->spjDisetujui();
        $p = $this->peserta($spj, $this->pengaju);
        foreach (['tiket' => 1_250_000, 'transport' => 85_000, 'lainnya' => 40_000] as $jenis => $nominal) {
            $this->unggah($this->pengaju, $spj, $p, $jenis, $nominal)->assertSessionHasNoErrors();
            $this->validasi($this->notaTerakhir())->assertSessionHasNoErrors();
            $this->assertEquals($nominal, $this->notaTerakhir()->nominal_dibayar);
            $this->assertNull($this->notaTerakhir()->selisih);
        }
    }

    public function test_selisih_penginapan_peringatan_bila_lebih_mahal_dan_info_bila_lebih_murah(): void
    {
        $spj = $this->spjDisetujui();
        $fahla = $this->peserta($spj, $this->fahla);
        $staf = $this->peserta($spj, $this->pengaju);
        $tarif = (float) $fahla->tarif_penginapan;

        // Lebih mahal: 1,5 x tarif per malam
        $this->unggah($this->fahla, $spj, $fahla, 'penginapan', $tarif * 1.5)->assertSessionHasNoErrors();
        $this->validasi($this->notaTerakhir())->assertSessionHasNoErrors();
        $s = SpjSelisihPenginapan::where('spj_biaya_id', $this->notaTerakhir()->id)->first();
        $this->assertSame('peringatan', $s->tingkat);
        $this->assertEquals(50, $s->persen);
        $this->assertSame('Jawa Timur', $s->provinsi);
        $this->assertSame('Staff', $s->kategori_tarif);

        // Lebih murah: 2 malam total 1,5 x tarif -> 0,75 x tarif per malam
        $this->unggah($this->pengaju, $spj, $staf, 'penginapan', $tarif * 1.5, ['jumlah_malam' => 2])->assertSessionHasNoErrors();
        $this->validasi($this->notaTerakhir())->assertSessionHasNoErrors();
        $s = SpjSelisihPenginapan::where('spj_biaya_id', $this->notaTerakhir()->id)->first();
        $this->assertSame('info', $s->tingkat);
        $this->assertEquals(-25, $s->persen);
        $this->assertEquals($tarif * 0.75, $s->nota_per_malam);

        // Sama dengan tarif: tidak dicatat
        $this->unggah($this->pengaju, $spj, $staf, 'penginapan', $tarif)->assertSessionHasNoErrors();
        $this->validasi($this->notaTerakhir())->assertSessionHasNoErrors();
        $this->assertSame(2, SpjSelisihPenginapan::count());

        // Nota ditolak tidak dicatat
        $this->unggah($this->fahla, $spj, $fahla, 'penginapan', $tarif * 3)->assertSessionHasNoErrors();
        $this->actingAs($this->muslih)->post(route('spj.nota.tolak', $this->notaTerakhir()), ['alasan' => 'Nota tidak terbaca'])
            ->assertSessionHasNoErrors();
        $this->assertSame('Ditolak', $this->notaTerakhir()->status);
        $this->assertSame(2, SpjSelisihPenginapan::count());
    }

    public function test_provinsi_tanpa_tarif_penginapan_divalidasi_manual_tanpa_selisih(): void
    {
        $spj = $this->spjDisetujui();
        $p = $this->peserta($spj, $this->pengaju);
        $p->update(['tarif_penginapan' => null, 'batas_penginapan' => null]);

        $this->unggah($this->pengaju, $spj, $p, 'penginapan', 600_000)->assertSessionHasNoErrors();
        $nota = $this->notaTerakhir();

        // Tanpa nominal manual -> ditolak dengan pesan
        $this->validasi($nota)->assertSessionHas('error');
        $this->assertSame('Menunggu', $nota->fresh()->status);
        // Melebihi nota -> ditolak
        $this->validasi($nota, null, ['nominal_dibayar' => 700_000])->assertSessionHas('error');

        $this->validasi($nota, null, ['nominal_dibayar' => 450_000])->assertSessionHasNoErrors();
        $this->assertEquals(450_000, $nota->fresh()->nominal_dibayar);
        $this->assertSame(0, SpjSelisihPenginapan::count());
    }

    public function test_hak_unggah_validasi_dan_berkas(): void
    {
        $diajukan = $this->spjDiajukan();
        $this->unggah($this->pengaju, $diajukan, $this->peserta($diajukan, $this->pengaju), 'tiket', 100_000)->assertForbidden();

        $spj = $this->spjDisetujui();
        $fahla = $this->peserta($spj, $this->fahla);
        $staf = $this->peserta($spj, $this->pengaju);
        $orangLain = $this->karyawanSpj('orang.lain', 6, $this->jabatanStaf);

        // Peserta hanya untuk dirinya; orang lain & HC tidak boleh
        $this->unggah($this->fahla, $spj, $staf, 'tiket', 100_000)->assertForbidden();
        $this->unggah($orangLain, $spj, $staf, 'tiket', 100_000)->assertForbidden();
        $this->unggah($this->yoga, $spj, $staf, 'tiket', 100_000)->assertForbidden();
        // Pengaju boleh untuk peserta mana pun
        $this->unggah($this->pengaju, $spj, $fahla, 'tiket', 100_000)->assertSessionHasNoErrors();
        $nota = $this->notaTerakhir();
        Storage::disk('local')->assertExists($nota->file_nota_path);

        // Peserta dari SPJ lain tidak bisa diselipkan
        $this->unggah($this->pengaju, $spj, $staf, 'tiket', 100_000, ['spj_peserta_id' => 999_999])->assertSessionHasErrors('spj_peserta_id');
        // Tanggal di luar perjalanan ditolak; penginapan melebihi jumlah malam ditolak
        $this->unggah($this->pengaju, $spj, $staf, 'tiket', 100_000, ['tanggal' => '2026-11-30'])->assertSessionHasErrors('tanggal');
        $this->unggah($this->pengaju, $spj, $staf, 'penginapan', 100_000, ['jumlah_malam' => 3])->assertSessionHasErrors('jumlah_malam');

        // Hanya Finance yang memvalidasi/menolak
        foreach ([$this->yoga, $this->pengaju, $this->ceoUser, $this->admin()] as $u) {
            $this->validasi($nota, $u)->assertForbidden();
            $this->actingAs($u)->post(route('spj.nota.tolak', $nota), ['alasan' => 'Tidak sesuai'])->assertForbidden();
        }
        $this->actingAs($this->muslih)->post(route('spj.nota.tolak', $nota), ['alasan' => ''])->assertSessionHasErrors('alasan');

        // Berkas: yang berhak melihat SPJ boleh, orang lain tidak
        $this->actingAs($this->fahla)->get(route('spj.nota.berkas', $nota))->assertOk();
        $this->actingAs($this->muslih)->get(route('spj.nota.berkas', $nota))->assertOk();
        $this->actingAs($orangLain)->get(route('spj.nota.berkas', $nota))->assertForbidden();

        // Hapus hanya saat Menunggu, oleh pengunggah/pengaju
        $this->actingAs($this->fahla)->delete(route('spj.nota.destroy', $nota))->assertForbidden();
        $this->validasi($nota)->assertSessionHasNoErrors();
        $this->actingAs($this->pengaju)->delete(route('spj.nota.destroy', $nota))->assertForbidden();
        // Validasi ulang ditolak
        $this->validasi($nota)->assertSessionHas('error');
    }

    public function test_pdf_akomodasi_terisi_dari_nota_divalidasi_saja(): void
    {
        $spj = $this->spjDisetujui();
        $fahla = $this->peserta($spj, $this->fahla);
        $tarif = (float) $fahla->tarif_penginapan;

        $this->unggah($this->fahla, $spj, $fahla, 'penginapan', $tarif * 2, ['jumlah_malam' => 2, 'keterangan' => 'Hotel Santika'])
            ->assertSessionHasNoErrors();
        $this->validasi($this->notaTerakhir())->assertSessionHasNoErrors();
        $this->unggah($this->fahla, $spj, $fahla, 'tiket', 777_000, ['keterangan' => 'Kereta'])->assertSessionHasNoErrors(); // belum divalidasi

        $data = app(SpjPdfService::class)->data($spj->fresh(), $this->ceoUser);
        $this->assertCount(1, $data['akomodasi']);
        $this->assertStringStartsWith('Penginapan '.$fahla->nama.' (2 malam) - Hotel Santika', $data['akomodasi'][0]['perincian']);
        $this->assertStringContainsString('(2 malam)', $data['akomodasi'][0]['perincian']);
        $this->assertEquals($tarif, $data['akomodasi'][0]['harian']);
        $this->assertStringContainsString('****0001', $data['akomodasi'][0]['ket']); // rekening tersamar untuk Direktur

        $html = view('pdf.spj', $data)->render();
        $total = (float) $spj->total_uang_harian + $tarif * 2;
        $this->assertStringContainsString('Rp '.number_format($total, 0, ',', '.'), $html);
        $this->assertStringContainsString(\App\Support\Terbilang::rupiah($total), $html);
        $this->assertStringNotContainsString('Belum ada nota akomodasi', $html);
        $this->assertStringNotContainsString('Kereta', $html);
    }

    public function test_rekap_per_provinsi_dan_panel_dashboard(): void
    {
        $spj = $this->spjDisetujui();
        $fahla = $this->peserta($spj, $this->fahla);
        $staf = $this->peserta($spj, $this->pengaju);
        $tarif = (float) $fahla->tarif_penginapan;
        $this->unggah($this->fahla, $spj, $fahla, 'penginapan', $tarif * 1.2)->assertSessionHasNoErrors();
        $this->validasi($this->notaTerakhir())->assertSessionHasNoErrors();
        $this->unggah($this->pengaju, $spj, $staf, 'penginapan', $tarif * 0.8)->assertSessionHasNoErrors();
        $this->validasi($this->notaTerakhir())->assertSessionHasNoErrors();
        $this->unggah($this->pengaju, $spj, $staf, 'tiket', 50_000)->assertSessionHasNoErrors(); // menunggu

        // Rekap: HC & Finance boleh, karyawan/direktur tidak
        $this->actingAs($this->pengaju)->get(route('spj.rekap-selisih'))->assertForbidden();
        $this->actingAs($this->ceoUser)->get(route('spj.rekap-selisih'))->assertForbidden();
        $this->actingAs($this->yoga)->get(route('spj.rekap-selisih', ['tahun' => 2026]))
            ->assertOk()
            ->assertInertia(fn ($p) => $p->component('PerjalananDinas/RekapSelisih')
                ->has('perProvinsi', 1)
                ->where('perProvinsi.0.provinsi', 'Jawa Timur')
                ->where('perProvinsi.0.kejadian', 2)
                ->where('perProvinsi.0.peringatan', 1)
                ->where('perProvinsi.0.info', 1)
                ->where('perProvinsi.0.rata_persen', fn ($v) => abs((float) $v) < 0.01) // (+20 + -20) / 2
                ->has('kejadian', 2));

        // Dashboard Finance: panel tampil dengan nota menunggu & peringatan
        $this->actingAs($this->muslih)->get(route('dashboard'))
            ->assertInertia(fn ($p) => $p->where('spjReimburse.notaMenunggu', 1)
                ->where('spjReimburse.peringatanTahunIni', 1)
                ->where('spjReimburse.infoTahunIni', 1)
                ->has('spjReimburse.peringatanTerbaru', 1));
        // Direktur: tidak ada panel
        $this->actingAs($this->ceoUser)->get(route('dashboard'))
            ->assertInertia(fn ($p) => $p->where('spjReimburse', null));
    }

    public function test_halaman_detail_menampilkan_nota_dan_total_termasuk_reimburse(): void
    {
        $spj = $this->spjDisetujui();
        $p = $this->peserta($spj, $this->pengaju);
        $this->unggah($this->pengaju, $spj, $p, 'tiket', 300_000)->assertSessionHasNoErrors();
        $this->validasi($this->notaTerakhir())->assertSessionHasNoErrors();

        $this->actingAs($this->pengaju)->get(route('spj.show', $spj))
            ->assertInertia(fn ($pg) => $pg
                ->where('spj.total_akomodasi', fn ($v) => (float) $v === 300000.0)
                ->where('spj.total', fn ($v) => (float) $v === (float) $spj->total_uang_harian + 300000)
                ->where('bisaValidasiNota', false)
                ->where('pesertas.1.biayas.0.status', 'Divalidasi')
                ->where('pesertas.1.bisa_unggah', true)
                ->where('pesertas.0.bisa_unggah', true)); // pengaju boleh untuk semua peserta

        $this->actingAs($this->muslih)->get(route('spj.show', $spj))
            ->assertInertia(fn ($pg) => $pg->where('bisaValidasiNota', true)->where('pesertas.0.bisa_unggah', false));
    }
}
