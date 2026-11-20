<?php

namespace Tests\Feature\Spj;

use App\Models\Spj;
use App\Models\SpjPeserta;
use App\Models\SpjRisalah;
use App\Models\SpjRisalahLampiran;
use App\Models\User;
use App\Services\Spj\RisalahSpjService;
use Database\Seeders\MasterTemplateSuratSeeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

/** B8b — koordinator, risalah setelah perjalanan, lampiran gambar per tanggal, PDF risalah. */
class RisalahSpjTest extends SpjTestCase
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
        Carbon::setTestNow('2026-11-20 09:00:00'); // sebelum perjalanan (27-29 Nov)
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
        DB::table('karyawans')->where('user_id', $this->fahla->id)->update(['nama_posisi' => 'Head of Artistic - Creative Team']);
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    private function spjDiajukan(array $ubah = []): Spj
    {
        $peserta = [$this->karyawanId($this->fahla), $this->karyawanId($this->pengaju)];
        $this->actingAs($this->pengaju)->post(route('spj.store'), $this->formSpj($peserta, array_merge([
            'tgl_berangkat' => '2026-11-27', 'tgl_pulang' => '2026-11-29', 'aksi' => 'ajukan',
        ], $ubah)))->assertSessionHasNoErrors();

        return Spj::latest('id')->first();
    }

    private function spjDisetujui(array $ubah = []): Spj
    {
        $spj = $this->spjDiajukan($ubah);
        foreach ([$this->yoga, $this->muslih, $this->ceoUser] as $u) {
            $this->actingAs($u)->post(route('spj.approve', $spj), ['jenis_ttd' => 'qr_code'])->assertSessionHasNoErrors();
        }

        return $spj->fresh();
    }

    private function isiRisalah(User $oleh, Spj $spj, array $ubah = [])
    {
        return $this->actingAs($oleh)->put(route('spj.risalah.update', $spj), array_merge([
            'topik' => 'Pertemuan bulanan pelanggan',
            'tempat' => 'Kantor pelanggan, Surabaya',
            'waktu' => 'Sesuai Rundown PD',
            'kegiatan' => [
                '2026-11-27' => ['Berangkat ke Surabaya', 'Briefing tim'],
                '2026-11-28' => ['Rapat koordinasi', '', 'Survei lokasi'],
                '2026-11-29' => [],
            ],
        ], $ubah));
    }

    private function gambar(string $nama = 'rundown.png', int $w = 400, int $h = 300): UploadedFile
    {
        return UploadedFile::fake()->image($nama, $w, $h); // PNG (GD container tanpa dukungan JPEG)
    }

    /** JPEG 1x1 asli (tanpa GD) untuk menguji unggahan .jpg. */
    private function jpeg(string $nama = 'foto.jpg'): UploadedFile
    {
        return UploadedFile::fake()->createWithContent($nama, base64_decode(
            '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA='
        ));
    }

    public function test_koordinator_dipilih_dari_peserta_di_form(): void
    {
        $spj = $this->spjDiajukan(['koordinator_karyawan_id' => $this->karyawanId($this->fahla), 'aksi' => 'draf']);
        $this->assertSame($this->karyawanId($this->fahla), (int) $spj->koordinator_karyawan_id);

        $this->actingAs($this->pengaju)->get(route('spj.edit', $spj))
            ->assertInertia(fn ($p) => $p->where('spj.koordinator_karyawan_id', $this->karyawanId($this->fahla)));

        // Bukan peserta ditolak
        $peserta = [$this->karyawanId($this->fahla), $this->karyawanId($this->pengaju)];
        $this->actingAs($this->pengaju)->post(route('spj.store'), $this->formSpj($peserta, [
            'koordinator_karyawan_id' => $this->karyawanId($this->yoga),
        ]))->assertSessionHasErrors('koordinator_karyawan_id');

        // Opsional
        $this->actingAs($this->pengaju)->post(route('spj.store'), $this->formSpj($peserta, ['koordinator_karyawan_id' => '']))
            ->assertSessionHasNoErrors();
        $this->assertNull(Spj::latest('id')->value('koordinator_karyawan_id'));
    }

    public function test_koordinator_diubah_di_detail_oleh_pengaju_atau_hc_selama_belum_selesai(): void
    {
        $spj = $this->spjDisetujui();
        $fahla = $this->karyawanId($this->fahla);
        $ubah = fn (User $u, $id) => $this->actingAs($u)->put(route('spj.koordinator', $spj), ['koordinator_karyawan_id' => $id]);

        $ubah($this->fahla, $fahla)->assertForbidden();
        $ubah($this->muslih, $fahla)->assertForbidden();
        $ubah($this->pengaju, $this->karyawanId($this->yoga))->assertSessionHasErrors('koordinator_karyawan_id');
        $ubah($this->pengaju, $fahla)->assertSessionHas('success');
        $this->assertSame($fahla, (int) $spj->fresh()->koordinator_karyawan_id);
        $ubah($this->yoga, null)->assertSessionHas('success');
        $this->assertNull($spj->fresh()->koordinator_karyawan_id);

        $spj->update(['status' => Spj::STATUS_SELESAI]);
        $ubah($this->pengaju, $fahla)->assertForbidden();
        $ubah($this->yoga, $fahla)->assertForbidden();
    }

    public function test_koordinator_boleh_unggah_nota_peserta_lain(): void
    {
        $spj = $this->spjDisetujui(['koordinator_karyawan_id' => $this->karyawanId($this->fahla)]);
        $staf = SpjPeserta::where('spj_id', $spj->id)->where('karyawan_id', $this->karyawanId($this->pengaju))->first();

        $this->actingAs($this->fahla)->post(route('spj.nota.store', $spj), [
            'spj_peserta_id' => $staf->id, 'jenis' => 'tiket', 'tanggal' => '2026-11-27', 'nominal_nota' => 100_000,
            'file_nota' => UploadedFile::fake()->create('nota.pdf', 50, 'application/pdf'),
        ])->assertRedirect()->assertSessionHas('success');
        $this->assertSame(1, \App\Models\SpjBiaya::where('spj_peserta_id', $staf->id)->count());
    }

    public function test_koordinator_tetap_tersimpan_saat_diajukan_dan_diajukan_ulang(): void
    {
        $fahla = $this->karyawanId($this->fahla);
        $spj = $this->spjDiajukan(['koordinator_karyawan_id' => $fahla]);
        $this->assertSame('Diajukan', $spj->status);
        $this->assertSame($fahla, (int) $spj->koordinator_karyawan_id);

        // Ditolak lalu diajukan ulang dari form: koordinator tetap
        $this->actingAs($this->yoga)->post(route('spj.tolak', $spj), ['alasan' => 'Revisi tanggal'])->assertSessionHasNoErrors();
        $peserta = [$fahla, $this->karyawanId($this->pengaju)];
        $this->actingAs($this->pengaju)->put(route('spj.update', $spj), $this->formSpj($peserta, [
            'tgl_berangkat' => '2026-11-27', 'tgl_pulang' => '2026-11-29', 'koordinator_karyawan_id' => $fahla, 'aksi' => 'ajukan',
        ]))->assertSessionHasNoErrors();
        $this->assertSame('Diajukan', $spj->fresh()->status);
        $this->assertSame($fahla, (int) $spj->fresh()->koordinator_karyawan_id);
    }

    public function test_risalah_hanya_setelah_berangkat_oleh_koordinator_atau_pengaju(): void
    {
        $diajukan = $this->spjDiajukan();
        $spj = $this->spjDisetujui(['koordinator_karyawan_id' => $this->karyawanId($this->fahla)]);

        // Sebelum tanggal berangkat
        $this->actingAs($this->fahla)->get(route('spj.risalah.edit', $spj))->assertForbidden();
        $this->isiRisalah($this->fahla, $spj)->assertForbidden();
        $this->actingAs($this->fahla)->get(route('spj.show', $spj))
            ->assertInertia(fn ($p) => $p->where('risalah.bisa_isi', false)
                ->where('risalah.alasan_tidak_bisa', fn ($a) => str_contains($a, 'setelah perjalanan dimulai')));

        Carbon::setTestNow('2026-11-27 18:00:00');

        // Bukan koordinator/pengaju, atau SPJ belum disetujui
        foreach ([$this->yoga, $this->muslih, $this->ceoUser, $this->admin()] as $u) {
            $this->isiRisalah($u, $spj)->assertForbidden();
        }
        $this->isiRisalah($this->pengaju, $diajukan)->assertForbidden();

        // Validasi: kepala wajib & minimal satu kegiatan
        $this->isiRisalah($this->fahla, $spj, ['topik' => ''])->assertSessionHasErrors('topik');
        $this->isiRisalah($this->fahla, $spj, ['kegiatan' => ['2026-11-27' => ['', ' ']]])->assertSessionHasErrors('kegiatan');

        // Koordinator mengisi; satu blok per tanggal, kegiatan kosong dibuang
        $this->actingAs($this->fahla)->get(route('spj.risalah.edit', $spj))
            ->assertOk()->assertInertia(fn ($p) => $p->component('PerjalananDinas/Risalah')->has('hari', 3));
        $this->isiRisalah($this->fahla, $spj)->assertSessionHasNoErrors()->assertRedirect(route('spj.show', $spj));
        $r = SpjRisalah::with('details')->where('spj_id', $spj->id)->first();
        $this->assertTrue($r->terisi());
        $this->assertCount(3, $r->details);
        $this->assertSame(['Rapat koordinasi', 'Survei lokasi'], $r->details[1]->kegiatan);
        $this->assertSame([], $r->details[2]->kegiatan);

        // Pengaju juga boleh mengubah
        $this->isiRisalah($this->pengaju, $spj, ['topik' => 'Topik revisi'])->assertSessionHasNoErrors();
        $this->assertSame('Topik revisi', $r->fresh()->topik);
        $this->assertSame(1, SpjRisalah::count());
    }

    public function test_lampiran_gambar_per_tanggal_privat(): void
    {
        $spj = $this->spjDisetujui();
        Carbon::setTestNow('2026-11-28 08:00:00');
        $unggah = fn (User $u, array $data) => $this->actingAs($u)->post(route('spj.risalah.lampiran.store', $spj), $data);

        $unggah($this->pengaju, ['tanggal' => '2026-11-27', 'gambar' => [$this->gambar('a.png'), $this->jpeg('b.jpg')]])
            ->assertSessionHas('success');
        $this->assertSame(2, SpjRisalahLampiran::count());
        $lamp = SpjRisalahLampiran::first();
        $this->assertStringStartsWith("spj/risalah/{$spj->id}/", $lamp->path);
        Storage::disk('local')->assertExists($lamp->path);

        $unggah($this->pengaju, ['tanggal' => '2026-11-30', 'gambar' => [$this->gambar()]])->assertSessionHasErrors('tanggal');
        $unggah($this->pengaju, ['tanggal' => '2026-11-27', 'gambar' => [UploadedFile::fake()->create('x.pdf', 10, 'application/pdf')]])
            ->assertSessionHasErrors('gambar.0');
        $unggah($this->yoga, ['tanggal' => '2026-11-27', 'gambar' => [$this->gambar()]])->assertForbidden();

        // Lihat: yang berhak melihat SPJ; orang lain tidak
        $orangLain = $this->karyawanSpj('orang.lain', 6, $this->jabatanStaf);
        $this->actingAs($this->fahla)->get(route('spj.risalah.lampiran.lihat', $lamp))->assertOk();
        $this->actingAs($this->muslih)->get(route('spj.risalah.lampiran.lihat', $lamp))->assertOk();
        $this->actingAs($orangLain)->get(route('spj.risalah.lampiran.lihat', $lamp))->assertForbidden();

        // Hapus: hanya pengisi risalah
        $this->actingAs($this->yoga)->delete(route('spj.risalah.lampiran.destroy', $lamp))->assertForbidden();
        $this->actingAs($this->pengaju)->delete(route('spj.risalah.lampiran.destroy', $lamp))->assertSessionHas('success');
        Storage::disk('local')->assertMissing($lamp->path);
        $this->assertSame(1, SpjRisalahLampiran::count());
    }

    public function test_foto_besar_diperkecil_saat_unggah_menurut_sisi_terpanjang(): void
    {
        $spj = $this->spjDisetujui();
        Carbon::setTestNow('2026-11-28 08:00:00');
        $ukuran = fn () => getimagesize(Storage::disk('local')->path(SpjRisalahLampiran::latest('id')->value('path')));

        // PNG potret 1000x2000 -> sisi terpanjang 1600 (800x1600)
        $this->actingAs($this->pengaju)->post(route('spj.risalah.lampiran.store', $spj), [
            'tanggal' => '2026-11-27', 'gambar' => [$this->gambar('potret.png', 1000, 2000)],
        ])->assertSessionHas('success');
        $this->assertSame([800, 1600], array_slice($ukuran(), 0, 2));

        // PNG kecil disimpan apa adanya
        $this->actingAs($this->pengaju)->post(route('spj.risalah.lampiran.store', $spj), [
            'tanggal' => '2026-11-27', 'gambar' => [$this->gambar('kecil.png', 640, 480)],
        ])->assertSessionHas('success');
        $this->assertSame([640, 480], array_slice($ukuran(), 0, 2));

        if (! function_exists('imagejpeg') || ! function_exists('imagecreatefromjpeg')) {
            $this->markTestSkipped('GD tanpa dukungan JPEG: bagian JPEG diuji setelah image ldp_app di-rebuild (Dockerfile --with-jpeg).');
        }
        // JPEG lanskap 2400x1600 -> 1600x1067, tetap JPEG
        $this->actingAs($this->pengaju)->post(route('spj.risalah.lampiran.store', $spj), [
            'tanggal' => '2026-11-28', 'gambar' => [UploadedFile::fake()->image('foto.jpg', 2400, 1600)],
        ])->assertSessionHas('success');
        $info = $ukuran();
        $this->assertSame(1600, $info[0]);
        $this->assertEqualsWithDelta(1067, $info[1], 1);
        $this->assertSame('image/jpeg', $info['mime']);
        $this->assertStringEndsWith('.jpg', SpjRisalahLampiran::latest('id')->value('path'));
    }

    public function test_pdf_risalah_lengkap_dan_tombol_cetak(): void
    {
        $spj = $this->spjDisetujui(['koordinator_karyawan_id' => $this->karyawanId($this->fahla)]);
        Carbon::setTestNow('2026-11-29 20:00:00');

        $this->actingAs($this->pengaju)->get(route('spj.risalah.pdf', $spj))->assertNotFound();
        $this->actingAs($this->pengaju)->get(route('spj.show', $spj))->assertInertia(fn ($p) => $p->where('risalah.terisi', false));

        $this->isiRisalah($this->fahla, $spj)->assertSessionHasNoErrors();
        $this->actingAs($this->fahla)->post(route('spj.risalah.lampiran.store', $spj), [
            'tanggal' => '2026-11-28', 'gambar' => [$this->gambar('besar.png', 1800, 1200)],
        ])->assertSessionHas('success');
        // PNG besar diperkecil saat unggah (maks 1600 px) agar render PDF hemat memori
        $simpan = getimagesize(Storage::disk('local')->path(SpjRisalahLampiran::latest('id')->value('path')));
        $this->assertSame(1600, $simpan[0], "lebar tersimpan: {$simpan[0]}x{$simpan[1]}");
        $this->assertEqualsWithDelta(1067, $simpan[1], 1); // 1800x1200 -> 1600x1067

        $this->actingAs($this->pengaju)->get(route('spj.show', $spj))->assertInertia(fn ($p) => $p->where('risalah.terisi', true)
            ->where('risalah.jumlah_kegiatan', 4)->where('risalah.jumlah_lampiran', 1));

        $svc = app(RisalahSpjService::class);
        $data = $svc->dataPdf($spj->fresh());
        $html = view('pdf.spj_risalah', $data)->render();
        foreach ([
            'RISALAH PERJALANAN DINAS', 'PT. LINTAS DATA PRIMA', 'Date/Time', 'Place', 'Topics', 'Attendance', 'Detail Perjalanan',
            '27 November 2026 - 29 November 2026 / Sesuai Rundown PD', 'Kantor pelanggan, Surabaya', 'Pertemuan bulanan pelanggan',
            'Jumat, 27 November 2026', 'Sabtu, 28 November 2026', 'Minggu, 29 November 2026',
            '<li>Berangkat ke Surabaya</li>', '<li>Survei lokasi</li>', 'Tidak ada kegiatan dicatat.',
            'Koordinator Perjalanan Dinas', $this->fahla->karyawan->nama_lengkap, 'Head of Artistic - Creative Team',
            $this->pengaju->karyawan->nama_lengkap,
        ] as $teks) {
            $this->assertStringContainsString($teks, $html, "PDF risalah harus memuat: {$teks}");
        }
        $this->assertDoesNotMatchRegularExpression('/\[(Nama|Jabatan|Tanggal|Topik)[^\]]*\]/i', $html);

        // Gambar diperkecil agar muat (maks 16 x 10,5 cm), rasio tetap
        $g = $data['details'][1]['gambar'][0];
        $this->assertLessThanOrEqual(16.0, $g['lebar']);
        $this->assertLessThanOrEqual(10.5, $g['tinggi']);
        $this->assertEqualsWithDelta(1.5, $g['lebar'] / $g['tinggi'], 0.02);

        // Endpoint PDF: yang berhak melihat; dua PDF berturut-turut aman
        $res = $this->actingAs($this->ceoUser)->get(route('spj.risalah.pdf', $spj));
        $res->assertOk();
        $this->assertSame('application/pdf', $res->headers->get('Content-Type'));
        $this->actingAs($this->karyawanSpj('orang.lain', 6, $this->jabatanStaf))->get(route('spj.risalah.pdf', $spj))->assertForbidden();
        $this->assertStringStartsWith('%PDF', $svc->buatPdf($spj->fresh())->output()); // render kedua berturut-turut aman

        // Tanpa koordinator: penanda tangan = pengaju
        $spj->update(['koordinator_karyawan_id' => null]);
        $data = $svc->dataPdf($spj->fresh());
        $this->assertSame('Pengaju', $data['penandaTangan']['label']);
        $this->assertSame($this->pengaju->karyawan->nama_lengkap, $data['penandaTangan']['nama']);
    }
}
