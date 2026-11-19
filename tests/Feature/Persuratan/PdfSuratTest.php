<?php

namespace Tests\Feature\Persuratan;

use App\Models\MasterTemplateSurat;
use App\Models\PengaturanSuratLayout;
use App\Models\SuratKeluar;
use App\Services\PdfGambarService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class PdfSuratTest extends PersuratanTestCase
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

    private function layout(array $o = []): PengaturanSuratLayout
    {
        return PengaturanSuratLayout::create(array_merge([
            'tahun_periode' => '2026', 'nama_perusahaan' => 'PT. LINTAS DATA PRIMA',
            'alamat' => 'Darmo Residence No. 1, Kasihan, Bantul - Yogyakarta',
            'telepon' => '(0274) 415632', 'email' => 'sales@ldp.net.id', 'website' => 'www.ldp.net.id',
            'kota_surat' => 'Bantul', 'is_active' => true,
        ], $o));
    }

    private function suratTerbit(string $kode, string $gaya): SuratKeluar
    {
        $surat = $this->buatDraf($this->buatUser(6), $kode);
        DB::table('master_template_surats')->where('id', $surat->template_id)->update(['gaya_kepala' => $gaya]);
        $this->setujui($surat);

        return $surat->fresh();
    }

    private function html(SuratKeluar $surat): string
    {
        $surat->load(['template', 'karyawan.jabatan', 'approvals.jabatan', 'approvals.userAktual.karyawan.jabatan']);

        return view('pdf.surat', [
            'surat' => $surat,
            'layout' => PengaturanSuratLayout::where('is_active', true)->first(),
            'konten' => $surat->isi_surat_final,
        ])->render();
    }

    public function test_dua_pdf_dirender_berturut_turut_tanpa_error(): void
    {
        $this->layout(['logo_iso_paths' => ['persuratan/layout/tidak-ada.png']]); // file hilang: dilewati
        $a = $this->suratTerbit('SKET', MasterTemplateSurat::GAYA_JUDUL_TENGAH);
        $b = $this->suratTerbit('SM', MasterTemplateSurat::GAYA_BLOK_NOMOR);

        foreach ([$a, $b, $a] as $surat) {
            $res = $this->actingAs($this->ceo())->get(route('keluar.pdf', $surat->id));
            $res->assertOk();
            $this->assertSame('application/pdf', $res->headers->get('Content-Type'));
            $this->assertStringStartsWith('%PDF', $res->getContent());
        }
    }

    public function test_gaya_a_judul_tengah_dan_gaya_b_blok_nomor(): void
    {
        $this->layout(['kota_surat' => 'Sleman']);
        $a = $this->suratTerbit('SKET', MasterTemplateSurat::GAYA_JUDUL_TENGAH);
        $b = $this->suratTerbit('SM', MasterTemplateSurat::GAYA_BLOK_NOMOR);

        $htmlA = $this->html($a);
        $this->assertStringContainsString('class="judul-surat"', $htmlA);
        $this->assertStringContainsString('Nomor : 001/SKET/LDP-HC/XI/2026', $htmlA);
        $this->assertStringNotContainsString('class="meta-surat"', $htmlA);

        $htmlB = $this->html($b);
        $this->assertStringContainsString('class="meta-surat"', $htmlB);
        $this->assertStringContainsString('Lampiran', $htmlB);
        $this->assertStringNotContainsString('class="judul-surat"', $htmlB);

        foreach ([$htmlA, $htmlB] as $html) {
            $this->assertStringContainsString('Sleman, 19 November 2026', $html);
            $this->assertStringContainsString('Head Office', $html);
            $this->assertStringContainsString('Darmo Residence No. 1, Kasihan, Bantul - Yogyakarta', $html);
            $this->assertMatchesRegularExpression('/Hotline<\/span>\s*\(0274\) 415632/', $html);
            $this->assertStringContainsString('class="kop-nama">PT. LINTAS DATA PRIMA', $html);
            $this->assertStringNotContainsString('<div class="footer-iso">', $html); // logo ISO belum diunggah
            $this->assertStringContainsString('data:image/svg+xml', $html); // QR verifikasi (TTD jenis qr_code)
        }
    }

    public function test_layout_menyimpan_kota_dan_logo_iso_serta_mewarisi_aset_lama(): void
    {
        $admin = $this->admin();
        $this->layout(['logo_header_path' => 'persuratan/layout/logo-lama.png', 'watermark_path' => 'persuratan/layout/wm-lama.png']);
        $form = [
            'tahun_periode' => '2026', 'nama_perusahaan' => 'PT. LINTAS DATA PRIMA',
            'alamat' => 'Darmo Residence', 'telepon' => '(0274) 415632', 'email' => 'sales@ldp.net.id',
            'website' => 'www.ldp.net.id', 'kota_surat' => 'Bantul', 'is_active' => true,
        ];

        $this->actingAs($admin)->post(route('layout.store'), $form + [
            'logo_iso' => [UploadedFile::fake()->image('iso9001.png'), UploadedFile::fake()->image('iso27001.png')],
        ])->assertSessionHasNoErrors();

        $aktif = PengaturanSuratLayout::where('is_active', true)->sole();
        $this->assertSame('Bantul', $aktif->kota_surat);
        $this->assertCount(2, $aktif->logo_iso_paths);
        $this->assertSame('persuratan/layout/logo-lama.png', $aktif->logo_header_path); // diwarisi
        $this->assertSame('persuratan/layout/wm-lama.png', $aktif->watermark_path);

        // Simpan lagi tanpa unggahan: logo ISO tetap terbawa
        $this->actingAs($admin)->post(route('layout.store'), $form)->assertSessionHasNoErrors();
        $this->assertCount(2, PengaturanSuratLayout::where('is_active', true)->sole()->logo_iso_paths);

        foreach ($aktif->logo_iso_paths as $p) {
            @unlink(storage_path('app/public/'.$p));
        }
    }

    public function test_template_menyimpan_gaya_kepala_dan_menolak_nilai_lain(): void
    {
        $admin = $this->admin();
        $data = ['nama_template' => 'Surat Kuasa', 'kode_surat' => 'SKX', 'konten' => '<p>x</p>'];

        $this->actingAs($admin)->post(route('template.store'), $data + ['gaya_kepala' => 'miring'])
            ->assertSessionHasErrors('gaya_kepala');
        $this->actingAs($admin)->post(route('template.store'), $data + ['gaya_kepala' => 'judul_tengah'])
            ->assertSessionHasNoErrors();

        $this->assertDatabaseHas('master_template_surats', ['kode_surat' => 'SKX', 'gaya_kepala' => 'judul_tengah']);
    }

    /** Buat gambar latar uji di disk public; kembalikan path relatifnya. */
    private function buatLatarUji(): string
    {
        $path = 'persuratan/layout/uji-latar-'.uniqid().'.png';
        $file = storage_path('app/public/'.$path);
        @mkdir(dirname($file), 0775, true);
        $img = imagecreatetruecolor(21, 30);
        imagefill($img, 0, 0, imagecolorallocate($img, 255, 255, 255));
        imagepng($img, $file);
        $this->beforeApplicationDestroyed(fn () => @unlink($file));

        return $path;
    }

    public function test_dengan_latar_penuh_tidak_memuat_kop_footer_watermark_css(): void
    {
        $this->layout(['latar_kop_path' => $this->buatLatarUji(), 'watermark_path' => $this->buatLatarUji()]);
        $html = $this->html($this->suratTerbit('SKET', MasterTemplateSurat::GAYA_JUDUL_TENGAH));

        $this->assertStringContainsString('<div class="latar-kop">', $html);
        $this->assertStringContainsString('margin: 3cm 1.8cm 6.5cm 2.5cm', $html);
        $this->assertStringNotContainsString('<table class="kop">', $html);
        $this->assertStringNotContainsString('<div class="footer">', $html);
        $this->assertStringNotContainsString('<div class="watermark">', $html);
        $this->assertStringContainsString("font-family: 'Carlito'", $html);
        $this->assertMatchesRegularExpression('/<p>Nomor : 001\/SKET\/LDP-HC\/XI\/2026<\/p>/', $html);
    }

    public function test_tanpa_latar_memakai_partial_lama(): void
    {
        $this->layout(['watermark_path' => $this->buatLatarUji()]);
        $html = $this->html($this->suratTerbit('SKET', MasterTemplateSurat::GAYA_JUDUL_TENGAH));

        $this->assertStringNotContainsString('<div class="latar-kop">', $html);
        $this->assertStringContainsString('<table class="kop">', $html);
        $this->assertStringContainsString('<div class="footer">', $html);
        $this->assertStringContainsString('<div class="watermark">', $html);
        $this->assertStringContainsString('margin: 1.2cm 2cm 3.8cm 2cm', $html);
    }

    public function test_dua_pdf_berlatar_dirender_berturut_turut_tanpa_error(): void
    {
        $this->layout(['latar_kop_path' => $this->buatLatarUji()]);
        $a = $this->suratTerbit('SKET', MasterTemplateSurat::GAYA_JUDUL_TENGAH);
        $b = $this->suratTerbit('SM', MasterTemplateSurat::GAYA_BLOK_NOMOR);

        foreach ([$a, $b] as $surat) {
            $res = $this->actingAs($this->ceo())->get(route('keluar.pdf', $surat->id));
            $res->assertOk();
            $this->assertStringStartsWith('%PDF', $res->getContent());
        }
    }

    public function test_layout_mengunggah_dan_mewarisi_gambar_latar(): void
    {
        $admin = $this->admin();
        $this->layout(['latar_kop_path' => 'persuratan/layout/latar-lama.jpg']);
        $form = [
            'tahun_periode' => '2026', 'nama_perusahaan' => 'PT. LINTAS DATA PRIMA',
            'kota_surat' => 'Bantul', 'is_active' => true,
        ];

        $this->actingAs($admin)->post(route('layout.store'), $form)->assertSessionHasNoErrors();
        $this->assertSame('persuratan/layout/latar-lama.jpg', PengaturanSuratLayout::where('is_active', true)->sole()->latar_kop_path);

        $this->actingAs($admin)->post(route('layout.store'), $form + [
            'latar_kop' => UploadedFile::fake()->image('latar.png', 182, 256),
        ])->assertSessionHasNoErrors();
        $baru = PengaturanSuratLayout::where('is_active', true)->sole()->latar_kop_path;
        $this->assertNotSame('persuratan/layout/latar-lama.jpg', $baru);
        @unlink(storage_path('app/public/'.$baru));
    }

    public function test_migrasi_latar_kop_aman_diulang_tidak_menimpa_dan_bisa_dibalik(): void
    {
        $this->assertFileExists(resource_path('kop/kop_latar_ldp_a4.jpg')); // salinan ikut repo
        $kosong = $this->layout();
        $diganti = $this->layout(['latar_kop_path' => 'persuratan/layout/latar-pilihan-hc.png']);

        $migrasi = require database_path('migrations/2026_11_20_100500_isi_latar_kop_layout_aktif.php');
        $migrasi->up();
        $migrasi->up();

        $this->assertSame('persuratan/layout/kop_latar_ldp_a4.jpg', $kosong->fresh()->latar_kop_path);
        $this->assertFileExists(storage_path('app/public/persuratan/layout/kop_latar_ldp_a4.jpg'));
        $this->assertSame('persuratan/layout/latar-pilihan-hc.png', $diganti->fresh()->latar_kop_path);

        $migrasi->down();
        $this->assertNull($kosong->fresh()->latar_kop_path);
        $this->assertSame('persuratan/layout/latar-pilihan-hc.png', $diganti->fresh()->latar_kop_path);
    }

    public function test_watermark_abu_abu_mempertahankan_transparansi(): void
    {
        $path = 'persuratan/layout/uji-wm-'.uniqid().'.png';
        $file = storage_path('app/public/'.$path);
        @mkdir(dirname($file), 0775, true);
        $img = imagecreatetruecolor(4, 4);
        imagesavealpha($img, true);
        imagefill($img, 0, 0, imagecolorallocatealpha($img, 0, 0, 0, 127));
        imagesetpixel($img, 1, 1, imagecolorallocatealpha($img, 101, 58, 146, 0)); // ungu LDP
        imagepng($img, $file);

        try {
            $uri = PdfGambarService::dataUri($path, abuAbu: true);
            $this->assertStringStartsWith('data:image/png;base64,', $uri);
            $hasil = imagecreatefromstring(base64_decode(substr($uri, strlen('data:image/png;base64,'))));
            $ungu = imagecolorsforindex($hasil, imagecolorat($hasil, 1, 1));
            $this->assertSame($ungu['red'], $ungu['green']);
            $this->assertSame($ungu['green'], $ungu['blue']);
            $this->assertSame(127, imagecolorsforindex($hasil, imagecolorat($hasil, 0, 0))['alpha']);

            $this->assertNull(PdfGambarService::dataUri('persuratan/layout/tidak-ada.png', abuAbu: true));
        } finally {
            @unlink($file);
        }
    }

    public function test_migrasi_data_gaya_kepala_bisa_dibalik(): void
    {
        $sket = $this->buatTemplate('sket');
        $sm = $this->buatTemplate('SM');

        $migrasi = require database_path('migrations/2026_11_20_100200_set_gaya_kepala_judul_tengah.php');
        $migrasi->up();
        $this->assertSame('judul_tengah', MasterTemplateSurat::find($sket)->gaya_kepala);
        $this->assertSame('blok_nomor', MasterTemplateSurat::find($sm)->gaya_kepala);

        $migrasi->down();
        $this->assertSame('blok_nomor', MasterTemplateSurat::find($sket)->gaya_kepala);
    }
}
