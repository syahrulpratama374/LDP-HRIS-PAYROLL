<?php

namespace Tests\Feature\Spj;

use App\Models\AuditTrail;
use App\Models\NomorSuratTerbit;
use App\Models\PengajuanSpj;
use App\Models\Spj;
use App\Models\SpjBiaya;
use App\Models\SpjPembayaran;
use App\Models\SpjPeserta;
use App\Models\User;
use App\Services\Spj\DinasLuarService;
use Database\Seeders\MasterTemplateSuratSeeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

/** B9 — Tandai Selesai (Finance) & kunci, pembatalan SPJ, pensiun SPJ lama, menu Approval SPJ, dashboard. */
class PenutupanSpjTest extends SpjTestCase
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
        Carbon::setTestNow('2026-11-30 09:00:00'); // setelah perjalanan 27-29 Nov
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

    private function spjDiajukan(): Spj
    {
        $peserta = [$this->karyawanId($this->fahla), $this->karyawanId($this->pengaju)];
        $this->actingAs($this->pengaju)->post(route('spj.store'), $this->formSpj($peserta, [
            'tgl_berangkat' => '2026-11-27', 'tgl_pulang' => '2026-11-29', 'aksi' => 'ajukan',
            'koordinator_karyawan_id' => $this->karyawanId($this->fahla),
        ]))->assertSessionHasNoErrors();

        return Spj::latest('id')->first();
    }

    private function spjDisetujui(): Spj
    {
        $spj = $this->spjDiajukan();
        foreach ([$this->yoga, $this->muslih, $this->ceoUser] as $u) {
            $this->actingAs($u)->post(route('spj.approve', $spj), ['jenis_ttd' => 'qr_code'])->assertSessionHasNoErrors();
        }

        return $spj->fresh();
    }

    private function peserta(Spj $spj, User $u): SpjPeserta
    {
        return SpjPeserta::where('spj_id', $spj->id)->where('karyawan_id', $this->karyawanId($u))->firstOrFail();
    }

    private function bayar(Spj $spj, SpjPeserta $p, string $jenis, float $nominal)
    {
        return $this->actingAs($this->muslih)->post(route('spj.pembayaran.store', $spj), [
            'spj_peserta_id' => $p->id, 'jenis' => $jenis, 'nominal' => $nominal, 'tanggal_transfer' => '2026-11-30',
            'bukti_transfer' => UploadedFile::fake()->create('tf.pdf', 20, 'application/pdf'),
        ]);
    }

    private function notaTervalidasi(SpjPeserta $p, float $nominal): SpjBiaya
    {
        return SpjBiaya::create([
            'spj_peserta_id' => $p->id, 'jenis' => 'tiket', 'tanggal' => '2026-11-27', 'nominal_nota' => $nominal,
            'file_nota_path' => 'x.pdf', 'status' => SpjBiaya::DIVALIDASI, 'nominal_dibayar' => $nominal,
            'diunggah_oleh' => $this->pengaju->id, 'divalidasi_oleh' => $this->muslih->id, 'divalidasi_pada' => now(),
        ]);
    }

    private function isiRisalah(Spj $spj)
    {
        return $this->actingAs($this->fahla)->put(route('spj.risalah.update', $spj), [
            'topik' => 'Pertemuan bulanan', 'tempat' => 'Surabaya', 'waktu' => 'Sesuai Rundown PD',
            'kegiatan' => ['2026-11-27' => ['Rapat koordinasi']],
        ]);
    }

    /** SPJ Disetujui dengan semua syarat Selesai terpenuhi. */
    private function spjSiapSelesai(): Spj
    {
        $spj = $this->spjDisetujui();
        foreach ([$this->fahla, $this->pengaju] as $u) {
            $p = $this->peserta($spj, $u);
            $this->bayar($spj, $p, 'uang_harian', (float) $p->total_uang_harian)->assertSessionHas('success');
        }
        $p = $this->peserta($spj, $this->pengaju);
        $this->notaTervalidasi($p, 250_000);
        $this->bayar($spj, $p, 'reimburse', 250_000)->assertSessionHas('success');
        $this->isiRisalah($spj)->assertSessionHasNoErrors();

        return $spj->fresh();
    }

    private function syarat(Spj $spj, User $u)
    {
        return $this->actingAs($u)->get(route('spj.show', $spj));
    }

    public function test_syarat_selesai_ditampilkan_dan_hanya_finance(): void
    {
        $spj = $this->spjDisetujui();

        $this->syarat($spj, $this->muslih)->assertInertia(fn ($p) => $p->where('penutupan.bisa_selesai', true)
            ->has('penutupan.syarat_belum', 2) // uang harian & risalah (belum ada nota/reimburse)
            ->where('penutupan.syarat_belum.0', fn ($s) => str_contains($s, 'Uang harian belum lunas'))
            ->where('penutupan.syarat_belum.1', fn ($s) => str_contains($s, 'Risalah')));
        $this->syarat($spj, $this->yoga)->assertInertia(fn ($p) => $p->where('penutupan.bisa_selesai', false));

        // Nota menunggu & reimburse belum lunas ikut muncul
        $p = $this->peserta($spj, $this->pengaju);
        $this->notaTervalidasi($p, 100_000);
        SpjBiaya::create([
            'spj_peserta_id' => $p->id, 'jenis' => 'transport', 'tanggal' => '2026-11-28', 'nominal_nota' => 50_000,
            'file_nota_path' => 'y.pdf', 'status' => SpjBiaya::MENUNGGU, 'diunggah_oleh' => $this->pengaju->id,
        ]);
        $this->syarat($spj, $this->muslih)->assertInertia(fn ($pg) => $pg->has('penutupan.syarat_belum', 4)
            ->where('penutupan.syarat_belum.1', 'Masih ada 1 nota menunggu validasi Finance.')
            ->where('penutupan.syarat_belum.2', fn ($s) => str_contains($s, 'Reimburse belum lunas') && str_contains($s, $p->nama)));

        // Ditolak bila syarat belum terpenuhi; selain Finance 403
        $this->actingAs($this->muslih)->post(route('spj.selesai', $spj))->assertSessionHas('error');
        $this->assertSame('Disetujui', $spj->fresh()->status);
        foreach ([$this->yoga, $this->pengaju, $this->ceoUser, $this->admin()] as $u) {
            $this->actingAs($u)->post(route('spj.selesai', $spj))->assertForbidden();
        }
    }

    public function test_tandai_selesai_lalu_semua_terkunci_dan_tercatat(): void
    {
        $spj = $this->spjSiapSelesai();
        $this->syarat($spj, $this->muslih)->assertInertia(fn ($p) => $p->where('penutupan.syarat_belum', []));

        $this->actingAs($this->muslih)->post(route('spj.selesai', $spj))->assertSessionHas('success');
        $spj->refresh();
        $this->assertSame('Selesai', $spj->status);
        $this->assertSame($this->muslih->id, $spj->diselesaikan_oleh);
        $this->assertNotNull($spj->diselesaikan_pada);
        $this->assertNotNull(AuditTrail::where('aksi', 'Tandai SPJ Selesai')->first());

        // Terkunci: nota, pembayaran, risalah, koordinator
        $p = $this->peserta($spj, $this->pengaju);
        $this->actingAs($this->pengaju)->post(route('spj.nota.store', $spj), [
            'spj_peserta_id' => $p->id, 'jenis' => 'tiket', 'tanggal' => '2026-11-27', 'nominal_nota' => 1000,
            'file_nota' => UploadedFile::fake()->create('n.pdf', 10, 'application/pdf'),
        ])->assertForbidden();
        $this->bayar($spj, $p, 'reimburse', 1)->assertSessionHas('error');
        $this->actingAs($this->muslih)->delete(route('spj.pembayaran.destroy', SpjPembayaran::first()), ['alasan' => 'Coba batal'])
            ->assertSessionHas('error');
        $this->isiRisalah($spj)->assertForbidden();
        $this->actingAs($this->pengaju)->put(route('spj.koordinator', $spj), ['koordinator_karyawan_id' => null])->assertForbidden();
        $this->actingAs($this->muslih)->post(route('spj.selesai', $spj))->assertSessionHas('error');
        $this->actingAs($this->yoga)->post(route('spj.batal', $spj), ['alasan' => 'Batal setelah selesai'])->assertForbidden();

        // Tetap dihitung Dinas Luar (status Selesai)
        $this->assertTrue(app(DinasLuarService::class)->sedangDinasLuar($this->karyawanId($this->fahla), '2026-11-28'));
    }

    public function test_pembatalan_sebelum_disetujui_oleh_pengaju(): void
    {
        $spj = $this->spjDiajukan();
        $this->actingAs($this->yoga)->post(route('spj.batal', $spj))->assertForbidden();
        $this->actingAs($this->fahla)->post(route('spj.batal', $spj))->assertForbidden();

        $this->actingAs($this->pengaju)->post(route('spj.batal', $spj))->assertRedirect(route('spj.show', $spj));
        $spj->refresh();
        $this->assertSame('Dibatalkan', $spj->status);
        $this->assertNull($spj->alasan_batal); // alasan opsional sebelum disetujui
        $this->assertSame($this->pengaju->id, $spj->dibatalkan_oleh);
        // Tidak bisa disetujui lagi
        $this->actingAs($this->yoga)->post(route('spj.approve', $spj), ['jenis_ttd' => 'qr_code'])->assertForbidden();
        $this->assertNotNull(AuditTrail::where('aksi', 'Batalkan SPJ')->first());

        // Ditolak: dibatalkan pengaju, tidak bisa dihapus permanen
        $tolak = $this->spjDiajukan();
        $this->actingAs($this->yoga)->post(route('spj.tolak', $tolak), ['alasan' => 'Revisi tanggal'])->assertSessionHasNoErrors();
        $this->actingAs($this->pengaju)->delete(route('spj.destroy', $tolak))->assertForbidden();
        $this->actingAs($this->pengaju)->post(route('spj.batal', $tolak), ['alasan' => 'Perjalanan ditunda'])->assertSessionHas('success');
        $this->assertSame('Dibatalkan', $tolak->fresh()->status);
        $this->assertSame('Perjalanan ditunda', $tolak->fresh()->alasan_batal);

        // Draft: tidak dibatalkan, tetapi dihapus
        $peserta = [$this->karyawanId($this->pengaju)];
        $this->actingAs($this->pengaju)->post(route('spj.store'), $this->formSpj($peserta))->assertSessionHasNoErrors();
        $draf = Spj::latest('id')->first();
        $this->actingAs($this->pengaju)->post(route('spj.batal', $draf))->assertForbidden();
        $this->actingAs($this->pengaju)->delete(route('spj.destroy', $draf))->assertRedirect(route('spj.index'));
        $this->assertNull(Spj::find($draf->id));
    }

    public function test_pembatalan_setelah_disetujui_hanya_hc_dengan_alasan_tanpa_pembayaran_aktif(): void
    {
        $spj = $this->spjDisetujui();
        $nomor = $spj->nomor_surat;
        $p = $this->peserta($spj, $this->fahla);

        foreach ([$this->pengaju, $this->muslih, $this->ceoUser, $this->admin()] as $u) {
            $this->actingAs($u)->post(route('spj.batal', $spj), ['alasan' => 'Perjalanan dibatalkan'])->assertForbidden();
        }
        $this->actingAs($this->yoga)->post(route('spj.batal', $spj), ['alasan' => ''])->assertSessionHasErrors('alasan');

        // Pembayaran aktif menghalangi
        $this->bayar($spj, $p, 'uang_harian', 100_000)->assertSessionHas('success');
        $this->actingAs($this->yoga)->post(route('spj.batal', $spj), ['alasan' => 'Perjalanan dibatalkan'])->assertForbidden();
        $this->syarat($spj, $this->yoga)->assertInertia(fn ($pg) => $pg->where('penutupan.bisa_batal', false)
            ->where('penutupan.alasan_tidak_bisa_batal', fn ($a) => str_contains($a, 'sudah ada pembayaran')));

        // Pembayaran yang sudah dibatalkan & nota tervalidasi tidak menghalangi
        $this->actingAs($this->muslih)->delete(route('spj.pembayaran.destroy', SpjPembayaran::first()), ['alasan' => 'Salah input'])
            ->assertSessionHas('success');
        $this->notaTervalidasi($p, 100_000);
        $this->actingAs($this->yoga)->post(route('spj.batal', $spj), ['alasan' => 'Perjalanan dibatalkan pelanggan'])
            ->assertSessionHas('success');

        $spj->refresh();
        $this->assertSame('Dibatalkan', $spj->status);
        $this->assertSame('Perjalanan dibatalkan pelanggan', $spj->alasan_batal);
        $this->assertSame($nomor, $spj->nomor_surat); // nomor tetap tercatat
        $this->assertTrue(NomorSuratTerbit::where('nomor', $nomor)->exists());
        $this->assertFalse(app(DinasLuarService::class)->sedangDinasLuar($this->karyawanId($this->fahla), '2026-11-28'));

        // Nomor tidak dipakai ulang: SPJ berikutnya mendapat nomor baru
        $baru = $this->spjDisetujui();
        $this->assertNotSame($nomor, $baru->nomor_surat);
        $this->assertStringStartsWith('002/', $baru->nomor_surat);

        // PDF SPJ yang dibatalkan memuat tanda DIBATALKAN
        $html = view('pdf.spj', app(\App\Services\Spj\SpjPdfService::class)->data($spj, $this->yoga))->render();
        $this->assertStringContainsString('DIBATALKAN', $html);
    }

    public function test_spj_lama_dipensiunkan_dan_laporan_hasil_tersimpan(): void
    {
        $this->actingAs($this->pengaju)->get(route('spj.lama.create'))
            ->assertRedirect(route('spj.create'))->assertSessionHas('error', fn ($m) => str_contains($m, 'Perjalanan Dinas (SPJ)'));
        $this->actingAs($this->pengaju)->post(route('spj.lama.store'), [
            'tujuan' => 'Surabaya', 'keperluan' => 'x', 'tgl_mulai' => '2026-12-01', 'tgl_selesai' => '2026-12-02',
            'komponen_biaya' => [['nama' => 'Tiket', 'nominal' => 1000]],
        ])->assertRedirect(route('spj.create'));
        $this->assertSame(0, PengajuanSpj::count());

        // Riwayat lama tetap bisa dibaca; laporan_hasil kini tersimpan
        $id = DB::table('pengajuan_spjs')->insertGetId([
            'karyawan_id' => $this->karyawanId($this->pengaju), 'tujuan' => 'Malang', 'keperluan' => 'Lama',
            'tgl_mulai' => '2026-11-01', 'tgl_selesai' => '2026-11-02', 'total_biaya' => 1000,
            'status_approval' => 'Menunggu Pelaporan', 'sudah_dibayar' => false, 'created_at' => now(), 'updated_at' => now(),
        ]);
        $this->actingAs($this->pengaju)->get(route('spj.lama.index'))->assertOk();
        $this->actingAs($this->pengaju)->post(route('spj.lama.laporan', $id), [
            'laporan_hasil' => 'Instalasi selesai dengan baik',
            'file_bukti' => UploadedFile::fake()->create('bon.pdf', 20, 'application/pdf'),
        ])->assertSessionHasNoErrors();
        $this->assertSame('Instalasi selesai dengan baik', DB::table('pengajuan_spjs')->where('id', $id)->value('laporan_hasil'));
    }

    public function test_menu_approval_spj_dan_dashboard_memakai_spj_baru(): void
    {
        // Filter "Menunggu Anda" lewat route menu spj.menunggu
        $menunggu = $this->spjDiajukan();
        $this->spjDisetujui(); // tidak menunggu yoga lagi
        $this->actingAs($this->yoga)->get(route('spj.menunggu'))
            ->assertOk()
            ->assertInertia(fn ($p) => $p->component('PerjalananDinas/Index')->where('filter.menunggu', true)
                ->has('spjs.data', 1)->where('spjs.data.0.id', $menunggu->id));
        $this->actingAs($this->yoga)->get(route('spj.index'))
            ->assertInertia(fn ($p) => $p->where('filter.menunggu', false)->has('spjs.data', 2));

        // Pintasan dashboard Finance memakai spj.menunggu (bila role punya menunya)
        $this->beriMenu(4, 'spj.menunggu');
        $this->actingAs($this->muslih)->get(route('dashboard'))
            ->assertInertia(fn ($p) => $p->where('pintasan', fn ($ps) => collect($ps)->contains('kunci', 'spj.menunggu')
                && ! collect($ps)->contains('kunci', 'admin.spj.index')));

        // Dashboard Supervisor: SPJ baru yang menunggu dirinya (lewat Delegasi Wewenang dari HC)
        $spv = $this->karyawanSpj('spv.lain', 5, $this->jabatanManager, 'Staff', $this->deptSls);
        $spvLain = $this->karyawanSpj('spv.dua', 5, $this->jabatanManager, 'Staff', $this->deptSls);
        DB::table('delegasi_wewenangs')->insert([
            'pemberi_id' => $this->karyawanId($this->yoga), 'penerima_id' => $this->karyawanId($spv),
            'tgl_mulai' => '2026-11-01', 'tgl_selesai' => '2026-12-31', 'status' => 'Aktif', 'created_at' => now(), 'updated_at' => now(),
        ]);
        $this->actingAs($spv)->get(route('dashboard'))
            ->assertInertia(fn ($p) => $p->component('Dashboard/Supervisor')->has('pendingSpj', 1)
                ->where('pendingSpj.0.id', $menunggu->id)
                ->where('pendingSpj.0.pengaju', $this->pengaju->name)
                ->where('pendingSpj.0.tujuan', 'Surabaya, Jawa Timur'));
        $this->actingAs($spvLain)->get(route('dashboard'))
            ->assertInertia(fn ($p) => $p->component('Dashboard/Supervisor')->has('pendingSpj', 0));
    }

    public function test_migrasi_menu_mengalihkan_approval_spj_ke_spj_baru(): void
    {
        $grup = DB::table('menus')->insertGetId(['title' => 'Approval Center', 'order' => 5, 'is_active' => true]);
        $lama = DB::table('menus')->insertGetId(['parent_id' => $grup, 'title' => 'Approval SPJ', 'route_name' => 'admin.spj.index', 'order' => 3, 'is_active' => true]);
        foreach ([2, 3, 4, 5] as $r) {
            DB::table('role_has_menus')->insert(['role_id' => $r, 'menu_id' => $lama]);
        }
        $migrasi = require database_path('migrations/2026_11_27_100100_alihkan_menu_approval_spj_ke_spj_baru.php');
        $migrasi->up();
        $migrasi->up(); // aman diulang

        $baru = DB::table('menus')->where('route_name', 'spj.menunggu')->get();
        $this->assertCount(1, $baru);
        $this->assertSame('Approval SPJ', $baru[0]->title);
        $this->assertSame(3, (int) $baru[0]->order);
        $this->assertEqualsCanonicalizing([1, 2, 3, 4, 5],
            DB::table('role_has_menus')->where('menu_id', $baru[0]->id)->pluck('role_id')->map(fn ($v) => (int) $v)->all());
        $this->assertSame('Arsip Approval SPJ (Lama)', DB::table('menus')->where('id', $lama)->value('title'));

        $migrasi->down();
        $this->assertFalse(DB::table('menus')->where('route_name', 'spj.menunggu')->exists());
        $this->assertSame('Approval SPJ', DB::table('menus')->where('id', $lama)->value('title'));
    }
}
