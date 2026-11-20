<?php

namespace Tests\Feature\Spj;

use App\Models\Spj;
use App\Models\User;
use App\Services\Spj\SpjPdfService;
use Database\Seeders\MasterTemplateSuratSeeder;
use Illuminate\Support\Carbon;

/** B8a — PDF SPJ resmi (bernomor), rekening sesuai peran, tanda tangan approver asli, QR verifikasi. */
class PdfSpjTest extends SpjTestCase
{
    private User $pengaju;

    private User $fahla;

    private User $yoga;

    private User $muslih;

    private User $ceoUser;

    protected function setUp(): void
    {
        parent::setUp();
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

    private function spjDiajukan(array $ubah = []): Spj
    {
        $peserta = [$this->karyawanId($this->fahla), $this->karyawanId($this->pengaju)];
        $this->actingAs($this->pengaju)->post(route('spj.store'), $this->formSpj($peserta, array_merge([
            'tgl_berangkat' => '2026-11-27', 'tgl_pulang' => '2026-11-29', 'aksi' => 'ajukan',
        ], $ubah)))->assertSessionHasNoErrors();

        return Spj::latest('id')->first();
    }

    private function spjTerbit(array $ubah = []): Spj
    {
        $spj = $this->spjDiajukan($ubah);
        foreach ([$this->yoga, $this->muslih, $this->ceoUser] as $u) {
            $this->actingAs($u)->post(route('spj.approve', $spj), ['jenis_ttd' => 'qr_code'])->assertSessionHasNoErrors();
        }

        return $spj->fresh();
    }

    private function html(Spj $spj, ?User $viewer): string
    {
        return view('pdf.spj', app(SpjPdfService::class)->data($spj, $viewer))->render();
    }

    public function test_pdf_hanya_untuk_spj_bernomor_dan_yang_berhak_melihat(): void
    {
        $spj = $this->spjDiajukan();
        $this->actingAs($this->yoga)->get(route('spj.pdf', $spj))->assertNotFound();

        $spj = $this->spjTerbit();
        [$lain] = [$this->karyawanSpj('orang.lain', 6, $this->jabatanStaf)];
        $this->actingAs($lain)->get(route('spj.pdf', $spj))->assertForbidden();

        foreach ([$this->pengaju, $this->fahla, $this->yoga, $this->muslih, $this->ceoUser, $this->admin()] as $u) {
            $res = $this->actingAs($u)->get(route('spj.pdf', $spj));
            $res->assertOk();
            $this->assertSame('application/pdf', $res->headers->get('Content-Type'));
        }
    }

    public function test_tombol_cetak_hanya_untuk_spj_bernomor(): void
    {
        $spj = $this->spjDiajukan();
        $this->actingAs($this->pengaju)->get(route('spj.show', $spj))
            ->assertInertia(fn ($p) => $p->where('bisaCetak', false));

        $spj = $this->spjTerbit();
        $this->actingAs($this->pengaju)->get(route('spj.show', $spj))
            ->assertInertia(fn ($p) => $p->where('bisaCetak', true));
    }

    public function test_isi_pdf_lengkap_tanpa_placeholder_dan_ttd_dari_approver_asli(): void
    {
        $spj = $this->spjTerbit(['tanggal_risalah_awal' => '2026-11-25']);
        $html = $this->html($spj, $this->yoga);

        foreach ([
            'SPJ BIAYA PERJALANAN DINAS', 'Nomor : '.$spj->nomor_surat,
            'Sesuai dengan Risalah Perjalanan Dinas tanggal 25 November 2026',
            'Surabaya, Jawa Timur', 'Instalasi perangkat pelanggan',
            'Jumat, 27 November 2026 - Minggu, 29 November 2026 (3 hari)',
            'UANG HARIAN', 'AKOMODASI', 'Belum ada nota akomodasi', 'TOTAL', 'Terbilang',
            'Akomodasi dan lainnya menggunakan sistem reimburse',
            'Diajukan Oleh', 'Diperiksa Oleh', 'Disetujui Oleh',
            $this->yoga->karyawan->nama_lengkap, $this->muslih->karyawan->nama_lengkap, $this->ceoUser->karyawan->nama_lengkap,
            $this->fahla->karyawan->nama_lengkap, $this->pengaju->karyawan->nama_lengkap,
            '27 - 29 Nov 2026',
        ] as $teks) {
            $this->assertStringContainsString($teks, $html, "PDF harus memuat: {$teks}");
        }
        $this->assertDoesNotMatchRegularExpression('/\[(Nama|Jabatan|Tanggal|Nomor)[^\]]*\]/i', $html);
        $this->assertStringNotContainsString('Menunggu TTD', $html);
        $this->assertStringContainsString('data:image/svg+xml;base64', $html); // QR verifikasi
        $this->assertStringNotContainsString($this->admin()->name, $html);

        // Terbilang = total uang harian (akomodasi masih 0)
        $this->assertStringContainsString(\App\Support\Terbilang::rupiah((float) $spj->total_uang_harian), $html);
    }

    public function test_spj_sepuluh_peserta_total_dan_terbilang_dari_baris_peserta(): void
    {
        $ids = [];
        for ($i = 1; $i <= 10; $i++) {
            $u = $this->karyawanSpj("peserta.{$i}", 6, $this->jabatanStaf, 'Staff', $this->deptSls);
            $this->beriRekening($u, '88800000'.str_pad((string) $i, 2, '0', STR_PAD_LEFT));
            $ids[] = $this->karyawanId($u);
        }
        $this->actingAs($this->pengaju)->post(route('spj.store'), $this->formSpj($ids, [
            'tgl_berangkat' => '2026-11-27', 'tgl_pulang' => '2026-11-29', 'aksi' => 'ajukan',
        ]))->assertSessionHasNoErrors();
        $spj = Spj::latest('id')->first();
        foreach ([$this->yoga, $this->muslih, $this->ceoUser] as $u) {
            $this->actingAs($u)->post(route('spj.approve', $spj), ['jenis_ttd' => 'qr_code'])->assertSessionHasNoErrors();
        }
        $spj->refresh();

        $data = app(SpjPdfService::class)->data($spj, $this->yoga);
        $this->assertCount(10, $data['uangHarian']);
        $ringkas = SpjPdfService::ringkasan($data['uangHarian'], $data['akomodasi']);
        $this->assertEquals(4_920_000, $ringkas['total']);
        $this->assertSame('Empat Juta Sembilan Ratus Dua Puluh Ribu Rupiah', $ringkas['terbilang']);

        $html = view('pdf.spj', $data)->render();
        $this->assertSame(2, substr_count($html, 'Rp 4.920.000')); // Subtotal Uang Harian & TOTAL
        $this->assertStringNotContainsString('Rp 984.000', $html);
        $this->assertStringContainsString('Empat Juta Sembilan Ratus Dua Puluh Ribu Rupiah', $html);
    }

    public function test_ringkasan_pdf_selalu_mengikuti_baris_yang_ditampilkan(): void
    {
        $spj = $this->spjTerbit();
        $data = app(SpjPdfService::class)->data($spj, $this->yoga);
        // Baris diganti setelah data disusun (seperti data uji sintetis): ringkasan tetap ikut baris
        $data['uangHarian'] = array_fill(0, 10, $data['uangHarian'][0]);
        $html = view('pdf.spj', $data)->render();

        $this->assertStringContainsString('Rp 4.920.000', $html);
        $this->assertStringContainsString('Empat Juta Sembilan Ratus Dua Puluh Ribu Rupiah', $html);
        $this->assertStringNotContainsString('Rp 984.000', $html);
    }

    public function test_kota_dirapikan_huruf_kapital_saat_disimpan(): void
    {
        $peserta = [$this->karyawanId($this->pengaju)];
        $this->actingAs($this->pengaju)->post(route('spj.store'), $this->formSpj($peserta, ['kota' => '  malang   kota ']))
            ->assertSessionHasNoErrors();
        $this->assertSame('Malang Kota', Spj::latest('id')->value('kota'));

        $this->actingAs($this->pengaju)->post(route('spj.store'), $this->formSpj($peserta, ['kota' => 'jakarta DKI']))
            ->assertSessionHasNoErrors();
        $this->assertSame('Jakarta DKI', Spj::latest('id')->value('kota'));
    }

    public function test_kalimat_risalah_hilang_bila_tanggal_risalah_kosong(): void
    {
        $spj = $this->spjTerbit(['tanggal_risalah_awal' => null]);
        $this->assertStringNotContainsString('Sesuai dengan Risalah', $this->html($spj, $this->yoga));
    }

    public function test_rekening_di_pdf_sesuai_peran_pengunduh(): void
    {
        $spj = $this->spjTerbit();

        // HC / Finance: semua lengkap
        foreach ([$this->yoga, $this->muslih] as $u) {
            $html = $this->html($spj, $u);
            $this->assertStringContainsString('9990000001', $html);
            $this->assertStringContainsString('9990000002', $html);
        }

        // Direktur: semua disamarkan
        $html = $this->html($spj, $this->ceoUser);
        $this->assertStringNotContainsString('9990000001', $html);
        $this->assertStringNotContainsString('9990000002', $html);
        $this->assertStringContainsString('****0001', $html);

        // Peserta: miliknya lengkap, milik orang lain disamarkan
        $html = $this->html($spj, $this->fahla);
        $this->assertStringContainsString('9990000001', $html);
        $this->assertStringNotContainsString('9990000002', $html);
        $this->assertStringContainsString('****0002', $html);
    }

    public function test_dua_pdf_berturut_turut_aman(): void
    {
        $spj = $this->spjTerbit();
        $svc = app(SpjPdfService::class);
        $a = $svc->buat($spj, $this->yoga)->output();
        $b = $svc->buat($spj->fresh(), $this->ceoUser)->output();

        $this->assertStringStartsWith('%PDF', $a);
        $this->assertStringStartsWith('%PDF', $b);
    }

    public function test_verifikasi_qr_publik_tanpa_login_dan_tanpa_rekening(): void
    {
        $spj = $this->spjTerbit();

        $this->get(route('verifikasi.spj', $spj->qr_code_token))
            ->assertOk()
            ->assertInertia(fn ($p) => $p->component('PerjalananDinas/Verifikasi')
                ->where('spj.nomor_surat', $spj->nomor_surat)
                ->has('pesertas', 2)
                ->has('approvals', 3));
        $this->assertStringNotContainsString('999000000', $this->get(route('verifikasi.spj', $spj->qr_code_token))->getContent());

        $this->get(route('verifikasi.spj', 'token-palsu'))->assertNotFound();
    }
}
