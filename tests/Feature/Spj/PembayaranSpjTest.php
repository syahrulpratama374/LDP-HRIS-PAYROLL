<?php

namespace Tests\Feature\Spj;

use App\Models\AuditTrail;
use App\Models\Spj;
use App\Models\SpjBiaya;
use App\Models\SpjPembayaran;
use App\Models\SpjPeserta;
use App\Models\User;
use App\Services\Spj\PembayaranSpjService;
use Database\Seeders\MasterTemplateSuratSeeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;

/** B7 — pembayaran uang harian & reimburse oleh Finance, bukti transfer privat, batas nominal, rekening per peran. */
class PembayaranSpjTest extends SpjTestCase
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
        Carbon::setTestNow('2026-11-30 09:00:00');
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

    private function peserta(Spj $spj, User $user): SpjPeserta
    {
        return SpjPeserta::where('spj_id', $spj->id)->where('karyawan_id', $this->karyawanId($user))->firstOrFail();
    }

    private function bayar(User $oleh, Spj $spj, SpjPeserta $p, string $jenis, float $nominal, array $ubah = [])
    {
        return $this->actingAs($oleh)->post(route('spj.pembayaran.store', $spj), array_merge([
            'spj_peserta_id' => $p->id, 'jenis' => $jenis, 'nominal' => $nominal, 'tanggal_transfer' => '2026-11-30',
            'bukti_transfer' => UploadedFile::fake()->create('transfer.pdf', 80, 'application/pdf'), 'catatan' => 'Transfer BCA',
        ], $ubah));
    }

    /** Nota tervalidasi langsung (aturan validasi sudah diuji di ReimburseSpjTest). */
    private function notaTervalidasi(SpjPeserta $p, float $dibayar): void
    {
        SpjBiaya::create([
            'spj_peserta_id' => $p->id, 'jenis' => 'tiket', 'tanggal' => '2026-11-27', 'nominal_nota' => $dibayar,
            'file_nota_path' => 'x.pdf', 'status' => SpjBiaya::DIVALIDASI, 'nominal_dibayar' => $dibayar,
            'diunggah_oleh' => $this->pengaju->id, 'divalidasi_oleh' => $this->muslih->id, 'divalidasi_pada' => now(),
        ]);
    }

    public function test_finance_mencatat_uang_harian_sampai_lunas_tidak_boleh_melebihi(): void
    {
        $spj = $this->spjDisetujui();
        $p = $this->peserta($spj, $this->fahla);
        $hak = (float) $p->total_uang_harian;
        $svc = app(PembayaranSpjService::class);
        $this->assertSame('Belum dibayar', $svc->status($p)['uang_harian']['status']);

        $this->bayar($this->muslih, $spj, $p, 'uang_harian', 100_000)->assertSessionHas('success');
        $this->assertSame('Sebagian', $svc->status($p)['uang_harian']['status']);

        // Melebihi sisa ditolak, tidak tersimpan, berkas tidak tertinggal
        $this->bayar($this->muslih, $spj, $p, 'uang_harian', $hak)->assertSessionHas('error');
        $this->assertSame(1, SpjPembayaran::count());
        $this->assertCount(1, Storage::disk('local')->allFiles());

        $this->bayar($this->muslih, $spj, $p, 'uang_harian', $hak - 100_000)->assertSessionHas('success');
        $st = $svc->status($p)['uang_harian'];
        $this->assertSame('Lunas', $st['status']);
        $this->assertEquals($hak, $st['dibayar']);

        $bayar = SpjPembayaran::latest('id')->first();
        Storage::disk('local')->assertExists($bayar->bukti_transfer_path);
        $this->assertStringStartsWith("spj/bukti-transfer/{$spj->id}/", $bayar->bukti_transfer_path);
        $this->assertSame($p->rekening_encrypted, $bayar->rekening_encrypted); // snapshot rekening tujuan

        // Uang harian semua peserta belum lunas (peserta kedua belum)
        $this->assertFalse($svc->uangHarianLunasSemua($spj));
        $this->bayar($this->muslih, $spj, $this->peserta($spj, $this->pengaju), 'uang_harian', $hak)->assertSessionHas('success');
        $this->assertTrue($svc->uangHarianLunasSemua($spj));
    }

    public function test_reimburse_tidak_boleh_melebihi_total_nota_tervalidasi_peserta(): void
    {
        $spj = $this->spjDisetujui();
        $p = $this->peserta($spj, $this->pengaju);
        $lain = $this->peserta($spj, $this->fahla);

        // Belum ada nota tervalidasi -> tidak bisa
        $this->bayar($this->muslih, $spj, $p, 'reimburse', 1)->assertSessionHas('error');

        $this->notaTervalidasi($p, 300_000);
        $this->notaTervalidasi($lain, 900_000); // milik peserta lain tidak menambah hak
        SpjBiaya::create([ // nota menunggu tidak dihitung
            'spj_peserta_id' => $p->id, 'jenis' => 'tiket', 'tanggal' => '2026-11-28', 'nominal_nota' => 500_000,
            'file_nota_path' => 'y.pdf', 'status' => SpjBiaya::MENUNGGU, 'diunggah_oleh' => $this->pengaju->id,
        ]);

        $this->bayar($this->muslih, $spj, $p, 'reimburse', 300_001)->assertSessionHas('error');
        $this->bayar($this->muslih, $spj, $p, 'reimburse', 200_000)->assertSessionHas('success');
        $this->bayar($this->muslih, $spj, $p, 'reimburse', 100_001)->assertSessionHas('error');
        $this->bayar($this->muslih, $spj, $p, 'reimburse', 100_000)->assertSessionHas('success');

        $st = app(PembayaranSpjService::class)->status($p)['reimburse'];
        $this->assertSame('Lunas', $st['status']);
        $this->assertEquals(300_000, $st['dibayar']);
    }

    public function test_hanya_finance_dan_hanya_saat_spj_disetujui(): void
    {
        $diajukan = $this->spjDiajukan();
        $this->bayar($this->muslih, $diajukan, $this->peserta($diajukan, $this->fahla), 'uang_harian', 1000)->assertSessionHas('error');

        $spj = $this->spjDisetujui();
        $p = $this->peserta($spj, $this->fahla);
        foreach ([$this->yoga, $this->pengaju, $this->fahla, $this->ceoUser, $this->admin()] as $u) {
            $this->bayar($u, $spj, $p, 'uang_harian', 1000)->assertForbidden();
        }
        // Peserta dari SPJ lain ditolak validasi; bukti wajib; tanggal masa depan ditolak
        $this->bayar($this->muslih, $spj, $p, 'uang_harian', 1000, ['spj_peserta_id' => $this->peserta($diajukan, $this->fahla)->id])
            ->assertSessionHasErrors('spj_peserta_id');
        $this->bayar($this->muslih, $spj, $p, 'uang_harian', 1000, ['bukti_transfer' => null])->assertSessionHasErrors('bukti_transfer');
        $this->bayar($this->muslih, $spj, $p, 'uang_harian', 1000, ['tanggal_transfer' => '2026-12-01'])->assertSessionHasErrors('tanggal_transfer');
        $this->assertSame(0, SpjPembayaran::count());

        // Peserta tanpa rekening tidak bisa dibayar
        $p->update(['rekening_encrypted' => null]);
        $this->bayar($this->muslih, $spj, $p, 'uang_harian', 1000)->assertSessionHas('error');
    }

    public function test_bukti_dan_rekening_sesuai_peran(): void
    {
        $spj = $this->spjDisetujui();
        $p = $this->peserta($spj, $this->fahla);
        $this->bayar($this->muslih, $spj, $p, 'uang_harian', 100_000)->assertSessionHas('success');
        $bayar = SpjPembayaran::first();

        // Bukti: Finance/HC/Admin & penerima; pengaju (bukan penerima) & direktur tidak
        foreach ([$this->muslih, $this->yoga, $this->admin(), $this->fahla] as $u) {
            $this->actingAs($u)->get(route('spj.pembayaran.bukti', $bayar))->assertOk();
        }
        foreach ([$this->pengaju, $this->ceoUser] as $u) {
            $this->actingAs($u)->get(route('spj.pembayaran.bukti', $bayar))->assertForbidden();
        }

        $lihat = fn (User $u) => $this->actingAs($u)->get(route('spj.show', $spj));
        $lihat($this->muslih)->assertInertia(fn ($pg) => $pg->where('pesertas.0.pembayarans.0.rekening', '9990000001')
            ->where('bisaCatatPembayaran', true));
        $lihat($this->fahla)->assertInertia(fn ($pg) => $pg->where('pesertas.0.pembayarans.0.rekening', '9990000001')
            ->where('pesertas.0.bisa_lihat_bukti', true)->where('pesertas.1.bisa_lihat_bukti', false)
            ->where('bisaCatatPembayaran', false));
        $lihat($this->pengaju)->assertInertia(fn ($pg) => $pg->where('pesertas.0.pembayarans.0.rekening', '****0001')
            ->where('pesertas.0.status_pembayaran.uang_harian.status', 'Sebagian'));
        $lihat($this->ceoUser)->assertInertia(fn ($pg) => $pg->where('pesertas.0.pembayarans.0.rekening', '****0001'));
    }

    public function test_audit_trail_dan_pembatalan(): void
    {
        $spj = $this->spjDisetujui();
        $p = $this->peserta($spj, $this->fahla);
        $this->bayar($this->muslih, $spj, $p, 'uang_harian', 100_000)->assertSessionHas('success');
        $bayar = SpjPembayaran::first();

        $audit = AuditTrail::where('aksi', 'Catat pembayaran SPJ')->latest('id')->first();
        $this->assertNotNull($audit);
        $this->assertSame($this->muslih->id, $audit->user_id);
        $this->assertSame(100000.0, (float) json_decode($audit->data_baru, true)['nominal']);

        // Pembatalan: hanya Finance, alasan wajib, tercatat
        $this->actingAs($this->yoga)->delete(route('spj.pembayaran.destroy', $bayar), ['alasan' => 'Salah input'])->assertForbidden();
        $this->actingAs($this->muslih)->delete(route('spj.pembayaran.destroy', $bayar), ['alasan' => ''])->assertSessionHasErrors('alasan');
        $this->actingAs($this->muslih)->delete(route('spj.pembayaran.destroy', $bayar), ['alasan' => 'Salah input nominal'])
            ->assertSessionHas('success');

        // Hanya ditandai: baris & bukti tetap ada, dengan alasan/oleh/kapan
        $bayar->refresh();
        $this->assertSame(1, SpjPembayaran::count());
        $this->assertNotNull($bayar->dibatalkan_pada);
        $this->assertSame($this->muslih->id, $bayar->dibatalkan_oleh);
        $this->assertSame('Salah input nominal', $bayar->alasan_batal);
        Storage::disk('local')->assertExists($bayar->bukti_transfer_path);

        // Tidak dihitung ke total dibayar -> sisa kembali penuh, bisa dicatat ulang sebesar hak
        $st = app(PembayaranSpjService::class)->status($p)['uang_harian'];
        $this->assertEquals(0, $st['dibayar']);
        $this->assertSame('Belum dibayar', $st['status']);
        $this->bayar($this->muslih, $spj, $p, 'uang_harian', (float) $p->total_uang_harian)->assertSessionHas('success');
        $this->assertSame('Lunas', app(PembayaranSpjService::class)->status($p)['uang_harian']['status']);

        // Tidak bisa dibatalkan dua kali
        $this->actingAs($this->muslih)->delete(route('spj.pembayaran.destroy', $bayar), ['alasan' => 'Batal lagi'])
            ->assertSessionHas('error');

        // Tetap tampil di riwayat dengan tanda dibatalkan; bukti tetap bisa dibuka yang berhak
        $this->actingAs($this->fahla)->get(route('spj.show', $spj))->assertInertia(fn ($pg) => $pg
            ->where('pesertas.0.pembayarans.0.dibatalkan', true)
            ->where('pesertas.0.pembayarans.0.alasan_batal', 'Salah input nominal')
            ->where('pesertas.0.pembayarans.0.dibatalkan_oleh', $this->muslih->name)
            ->where('pesertas.0.pembayarans.1.dibatalkan', false));
        $this->actingAs($this->fahla)->get(route('spj.pembayaran.bukti', $bayar))->assertOk();
        $this->actingAs($this->yoga)->get(route('spj.pembayaran.bukti', $bayar))->assertOk();
        $this->actingAs($this->pengaju)->get(route('spj.pembayaran.bukti', $bayar))->assertForbidden();

        $batal = AuditTrail::where('aksi', 'Batalkan pembayaran SPJ')->latest('id')->first();
        $this->assertSame(100000.0, (float) json_decode($batal->data_lama, true)['nominal']);
        $this->assertNull(json_decode($batal->data_lama, true)['dibatalkan_pada']);
        $this->assertSame('Salah input nominal', json_decode($batal->data_baru, true)['alasan']);
        $this->assertNotNull(json_decode($batal->data_baru, true)['dibatalkan_pada']);
    }
}
