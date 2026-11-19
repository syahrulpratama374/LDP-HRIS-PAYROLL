<?php

namespace Tests\Feature\Spj;

use App\Models\NomorSuratTerbit;
use App\Models\Spj;
use App\Models\SpjApproval;
use App\Models\User;
use App\Services\PenomoranSuratService;
use Database\Seeders\MasterTarifTerSeeder;
use Database\Seeders\MasterTemplateSuratSeeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class PersetujuanSpjTest extends SpjTestCase
{
    private User $pengaju;

    private User $fahla;

    private User $yoga;

    private User $muslih;

    private User $ceoUser;

    protected function setUp(): void
    {
        parent::setUp();
        Carbon::setTestNow('2026-08-20 09:00:00');
        $this->seed(MasterTemplateSuratSeeder::class); // template & rute SPJ-PD (HC -> Finance -> Direktur)
        foreach ([2, 3, 4, 5, 6] as $role) {
            $this->beriMenu($role, 'spj.index');
        }

        $this->pengaju = $this->karyawanSpj('staff.cre1', 6, $this->jabatanStaf, 'Staff', $this->deptSls);
        $this->fahla = $this->karyawanSpj('fahla', 5, $this->jabatanManager, 'Staff', $this->deptSls);
        $this->yoga = $this->karyawanSpj('yoga', 3, $this->jabatanManager, 'Manager', $this->deptHc);
        $this->muslih = $this->karyawanSpj('muslih', 4, $this->jabatanManager, 'Manager');
        $this->ceoUser = $this->karyawanSpj('ceo', 2, $this->jabatanDirut, 'Direksi', $this->deptBod);
        foreach ([$this->pengaju, $this->fahla, $this->yoga] as $u) {
            $this->beriRekening($u, '99900000'.$u->id);
        }
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    /** SPJ contoh diajukan oleh $pengaju dengan peserta tertentu. */
    private function spjDiajukan(?User $pengaju = null, ?array $peserta = null): Spj
    {
        $pengaju ??= $this->pengaju;
        $peserta ??= [$this->fahla, $this->pengaju];
        $this->actingAs($pengaju)->post(route('spj.store'),
            $this->formSpj(array_map(fn ($u) => $this->karyawanId($u), $peserta), ['aksi' => 'ajukan']))
            ->assertSessionHasNoErrors();

        return Spj::latest('id')->first();
    }

    private function setujuiSpj(Spj $spj, User $oleh)
    {
        return $this->actingAs($oleh)->post(route('spj.approve', $spj), ['jenis_ttd' => 'qr_code']);
    }

    public function test_ajukan_membuat_langkah_dari_rute_template_spj_pd(): void
    {
        $spj = $this->spjDiajukan();

        $langkah = $spj->approvals()->get()->map(fn ($a) => [$a->urutan_langkah, $a->tipe_penyetuju, $a->role_id, $a->jabatan_id, $a->label_ttd, $a->status])->all();
        $this->assertSame([
            [1, 'role', 3, null, 'Diajukan Oleh', 'Menunggu'],
            [2, 'role', 4, null, 'Diperiksa Oleh', 'Menunggu'],
            [3, 'jabatan', null, $this->jabatanDirut, 'Disetujui Oleh', 'Menunggu'],
        ], $langkah);
        $this->assertSame('Diajukan', $spj->status);
        $this->assertNull($spj->nomor_surat);
    }

    public function test_rute_hc_finance_direktur_berurutan_dan_nomor_terbit_di_persetujuan_terakhir(): void
    {
        $spj = $this->spjDiajukan();

        // Urutan wajib: Finance dan Direktur belum boleh sebelum HC
        $this->setujuiSpj($spj, $this->muslih)->assertForbidden();
        $this->setujuiSpj($spj, $this->ceoUser)->assertForbidden();

        $this->setujuiSpj($spj, $this->yoga)->assertSessionHasNoErrors();
        $this->assertNull($spj->fresh()->nomor_surat);
        $this->setujuiSpj($spj, $this->ceoUser)->assertForbidden();

        $this->setujuiSpj($spj, $this->muslih)->assertSessionHasNoErrors();
        $this->assertNull($spj->fresh()->nomor_surat);
        $this->assertSame('Diajukan', $spj->fresh()->status);

        $this->setujuiSpj($spj, $this->ceoUser)->assertSessionHasNoErrors()->assertRedirect(route('spj.show', $spj));

        $spj->refresh();
        $this->assertSame('Disetujui', $spj->status);
        $this->assertSame('001/SPJ-PD/LDP-HC/VIII/2026', $spj->nomor_surat);
        $this->assertNotNull($spj->tanggal_terbit);
        $this->assertNotNull($spj->qr_code_token);
        $this->assertDatabaseHas('nomor_surat_terbits', [
            'nomor' => '001/SPJ-PD/LDP-HC/VIII/2026', 'sumber_type' => Spj::class, 'sumber_id' => $spj->id,
        ]);
        $this->assertSame(['Disetujui', 'Disetujui', 'Disetujui'], $spj->approvals()->pluck('status')->all());
        $this->assertSame(
            [$this->yoga->id, $this->muslih->id, $this->ceoUser->id],
            $spj->approvals()->pluck('user_id_aktual')->all()
        );

        // Sudah terbit: persetujuan ulang ditolak, nomor tidak berubah
        $this->setujuiSpj($spj, $this->ceoUser)->assertForbidden();
        $this->assertSame(1, NomorSuratTerbit::count());
    }

    public function test_nomor_spj_pd_berbagi_urutan_global_dengan_surat_lain(): void
    {
        app(PenomoranSuratService::class)->terbitkan('SKET', 'LDP-HC'); // 001
        $spj = $this->spjDiajukan();
        foreach ([$this->yoga, $this->muslih, $this->ceoUser] as $u) {
            $this->setujuiSpj($spj, $u);
        }

        $this->assertSame('002/SPJ-PD/LDP-HC/VIII/2026', $spj->fresh()->nomor_surat);
    }

    public function test_pengaju_peserta_dan_admin_ditolak_dengan_saran_delegasi(): void
    {
        // Pengaju yang memegang role HC tidak bisa menyetujui SPJ-nya sendiri
        $spjYoga = $this->spjDiajukan($this->yoga, [$this->fahla]);
        $res = $this->setujuiSpj($spjYoga, $this->yoga)->assertForbidden();
        $this->assertStringContainsString('Delegasi Wewenang', $res->exception->getMessage());
        $this->assertStringContainsString('Pengaju', $res->exception->getMessage());

        // Peserta yang memegang role HC tidak bisa menyetujui SPJ yang memuat dirinya
        $spjPeserta = $this->spjDiajukan($this->pengaju, [$this->yoga, $this->pengaju]);
        $res = $this->setujuiSpj($spjPeserta, $this->yoga)->assertForbidden();
        $this->assertStringContainsString('Peserta', $res->exception->getMessage());
        $this->assertStringContainsString('Delegasi Wewenang', $res->exception->getMessage());

        $this->actingAs($this->yoga)->get(route('spj.show', $spjPeserta))
            ->assertInertia(fn ($p) => $p->where('bisaSetujui', false)
                ->where('alasanTidakBisa', fn ($m) => str_contains($m, 'Delegasi Wewenang')));

        // Admin tidak menandatangani SPJ
        $res = $this->setujuiSpj($spjPeserta, $this->admin())->assertForbidden();
        $this->assertStringContainsString('Admin', $res->exception->getMessage());

        // Tolak juga tunduk pada aturan yang sama
        $this->actingAs($this->yoga)->post(route('spj.tolak', $spjPeserta), ['alasan' => 'Tidak sesuai'])->assertForbidden();
        $this->assertSame(['Menunggu', 'Menunggu', 'Menunggu'], $spjPeserta->approvals()->pluck('status')->all());
    }

    public function test_tidak_berhak_ditolak_403_dan_tidak_bisa_melihat(): void
    {
        $spj = $this->spjDiajukan();
        $orangLain = $this->karyawanSpj('staff.sls1');

        $this->setujuiSpj($spj, $orangLain)->assertForbidden();
        $this->setujuiSpj($spj, $this->fahla)->assertForbidden(); // peserta & bukan HC
        $this->actingAs($orangLain)->get(route('spj.show', $spj))->assertForbidden();
        $this->assertSame('Menunggu', $spj->approvals()->first()->status);
    }

    public function test_delegasi_aktif_mewarisi_role_pemberi_dan_tercatat_atas_nama(): void
    {
        // yoga (HC) ikut sebagai peserta -> mendelegasikan ke hakim (SPV, role 5)
        $hakim = $this->karyawanSpj('hakim', 5, $this->jabatanStaf, 'Staff', $this->deptHc);
        $spj = $this->spjDiajukan($this->pengaju, [$this->yoga, $this->pengaju]);

        $this->setujuiSpj($spj, $hakim)->assertForbidden(); // belum ada delegasi

        $delegasi = fn (string $mulai, string $selesai, string $status) => DB::table('delegasi_wewenangs')->insert([
            'pemberi_id' => $this->karyawanId($this->yoga), 'penerima_id' => $this->karyawanId($hakim),
            'tgl_mulai' => $mulai, 'tgl_selesai' => $selesai, 'status' => $status, 'created_at' => now(), 'updated_at' => now(),
        ]);
        $delegasi('2026-08-01', '2026-08-10', 'Aktif');   // sudah lewat
        $delegasi('2026-08-19', '2026-08-21', 'Dicabut'); // tidak aktif
        $this->setujuiSpj($spj, $hakim)->assertForbidden();

        $delegasi('2026-08-19', '2026-08-21', 'Aktif');
        $this->actingAs($hakim)->get(route('spj.index'))
            ->assertInertia(fn ($p) => $p->where('jumlahMenungguSaya', 1)->where('spjs.data.0.menunggu_saya', true));
        $this->setujuiSpj($spj, $hakim)->assertSessionHasNoErrors();

        $langkah = $spj->approvals()->first();
        $this->assertSame('Disetujui', $langkah->status);
        $this->assertSame($hakim->id, $langkah->user_id_aktual);
        $this->assertSame($this->karyawanId($this->yoga), $langkah->atas_nama_karyawan_id);
        $this->assertStringContainsString('Plt.', $langkah->catatan);
    }

    public function test_tolak_wajib_alasan_lalu_pengaju_merevisi_dan_mengajukan_ulang(): void
    {
        $spj = $this->spjDiajukan();

        $this->actingAs($this->yoga)->post(route('spj.tolak', $spj), ['alasan' => ''])->assertSessionHasErrors('alasan');
        $this->assertSame('Diajukan', $spj->fresh()->status);

        $this->actingAs($this->yoga)->post(route('spj.tolak', $spj), ['alasan' => 'Tanggal tidak sesuai risalah'])
            ->assertSessionHasNoErrors();
        $spj->refresh();
        $this->assertSame('Ditolak', $spj->status);
        $this->assertSame('Tanggal tidak sesuai risalah', $spj->catatan_revisi);
        $this->assertSame('Ditolak', $spj->approvals()->first()->status);
        $this->setujuiSpj($spj, $this->muslih)->assertForbidden();

        // Pengaju merevisi & mengajukan ulang: langkah dibuat ulang dari awal
        $this->actingAs($this->pengaju)->put(route('spj.update', $spj),
            $this->formSpj([$this->karyawanId($this->fahla), $this->karyawanId($this->pengaju)], ['tgl_pulang' => '2026-08-28', 'aksi' => 'ajukan']))
            ->assertSessionHasNoErrors();
        $spj->refresh();
        $this->assertSame('Diajukan', $spj->status);
        $this->assertNull($spj->catatan_revisi);
        $this->assertSame(2, $spj->jumlah_hari);
        $this->assertSame(['Menunggu', 'Menunggu', 'Menunggu'], $spj->approvals()->pluck('status')->all());
    }

    public function test_direktur_melihat_spj_saat_menunggu_dirinya(): void
    {
        $spj = $this->spjDiajukan();

        $this->actingAs($this->ceoUser)->get(route('spj.show', $spj))->assertForbidden();
        $this->setujuiSpj($spj, $this->yoga);
        $this->setujuiSpj($spj, $this->muslih);

        $this->actingAs($this->ceoUser)->get(route('spj.show', $spj))->assertOk()
            ->assertInertia(fn ($p) => $p->where('bisaSetujui', true)
                ->where('approvals.2.aktif', true)
                ->where('approvals.0.nama_aktual', $this->yoga->karyawan->nama_lengkap)
                ->where('pesertas.0.rekening', '****'.substr('99900000'.$this->fahla->id, -4)));

        $this->setujuiSpj($spj, $this->ceoUser);
        // Setelah menyetujui, Direktur tetap bisa membuka SPJ (pernah bertindak)
        $this->actingAs($this->ceoUser)->get(route('spj.show', $spj))->assertOk()
            ->assertInertia(fn ($p) => $p->where('bisaSetujui', false));
    }

    public function test_spj_baru_yang_disetujui_tidak_pernah_masuk_payroll(): void
    {
        $this->seed(MasterTarifTerSeeder::class);
        DB::table('master_ptkps')->insert(['id' => 1, 'kode_ptkp' => 'TK/0', 'nominal_neto_tahunan' => 54_000_000, 'kategori_ter' => 'A']);
        foreach ([$this->fahla, $this->pengaju] as $u) {
            DB::table('riwayat_gajis')->insert([
                'karyawan_id' => $this->karyawanId($u), 'nominal_gaji_pokok' => 5_000_000,
                'effective_date_start' => '2026-01-01', 'effective_date_end' => null,
            ]);
        }
        $spj = $this->spjDiajukan();
        foreach ([$this->yoga, $this->muslih, $this->ceoUser] as $u) {
            $this->setujuiSpj($spj, $u);
        }
        $this->assertSame('Disetujui', $spj->fresh()->status);

        $this->actingAs($this->admin())->post(route('admin.payroll.generate'), ['periode_bulan' => 8, 'periode_tahun' => 2026])
            ->assertSessionHasNoErrors();

        $this->assertGreaterThan(0, DB::table('payrolls')->where('periode_bulan', 8)->count());
        $this->assertSame(0, DB::table('detail_payrolls')->where('nama_komponen_snapshot', 'like', '%SPJ%')->count());
        $this->assertSame(0, DB::table('pengajuan_spjs')->count());
    }

    public function test_migrasi_pengaman_membuat_langkah_untuk_spj_diajukan_tanpa_langkah(): void
    {
        $spj = $this->spjDiajukan();
        $spj->approvals()->delete(); // kondisi SPJ yang diajukan di B3 (sebelum alur persetujuan ada)
        $draf = Spj::create($spj->only(['unit_penerbit_id', 'dibuat_oleh', 'provinsi', 'kota', 'tgl_berangkat', 'tgl_pulang', 'jumlah_hari', 'jumlah_malam', 'keperluan']) + ['status' => 'Draft']);

        $migrasi = require database_path('migrations/2026_11_23_100100_buat_langkah_approval_spj_diajukan.php');
        $migrasi->up();
        $migrasi->up();

        $this->assertSame(3, $spj->approvals()->count());
        $this->assertSame(0, $draf->approvals()->count());
        $this->setujuiSpj($spj, $this->yoga)->assertSessionHasNoErrors(); // langsung bisa diproses

        // down() hanya menghapus langkah yang belum disentuh
        $lain = $this->spjDiajukan();
        $lain->approvals()->delete();
        $migrasi->up();
        $migrasi->down();
        $this->assertSame(0, $lain->approvals()->count());
        $this->assertSame(3, $spj->approvals()->count());
        $this->assertSame(SpjApproval::DISETUJUI, $spj->approvals()->first()->status);
    }
}
