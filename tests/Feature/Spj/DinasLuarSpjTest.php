<?php

namespace Tests\Feature\Spj;

use App\Services\Spj\DinasLuarService;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Tests\Feature\Keuangan\KeuanganTestCase;

/**
 * B5 — Dinas Luar otomatis untuk SEMUA peserta SPJ baru berstatus Disetujui/Selesai
 * (bypass radius, monitor HC, Auto-Alpha -> Dinas Luar), digabung dengan SPJ lama.
 */
class DinasLuarSpjTest extends KeuanganTestCase
{
    private const KANTOR = '-7.8014,110.3644';

    private const LUAR_KOTA = '-7.7014,110.3644';

    private const FOTO = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ==';

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');
        DB::table('pengaturans')->insert([
            ['kunci' => 'koordinat_kantor', 'nilai' => self::KANTOR, 'created_at' => now(), 'updated_at' => now()],
            ['kunci' => 'radius_absensi', 'nilai' => '50', 'created_at' => now(), 'updated_at' => now()],
            ['kunci' => 'jam_masuk_operasional', 'nilai' => '08:00', 'created_at' => now(), 'updated_at' => now()],
        ]);
        // Senin 12 Jan 2026, 07:50 WIB
        Carbon::setTestNow(Carbon::parse('2026-01-12 07:50:00', 'Asia/Jakarta'));
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    /** SPJ baru dengan banyak peserta. */
    private function buatSpjBaru(array $pesertaIds, string $status, string $berangkat = '2026-01-11', string $pulang = '2026-01-14'): int
    {
        $spjId = DB::table('spjs')->insertGetId([
            'uuid' => (string) \Illuminate\Support\Str::uuid(),
            'unit_penerbit_id' => 1, 'dibuat_oleh' => 1,
            'provinsi' => 'Jawa Timur', 'kota' => 'Surabaya',
            'tgl_berangkat' => $berangkat, 'tgl_pulang' => $pulang,
            'jumlah_hari' => 4, 'jumlah_malam' => 3, 'keperluan' => 'Instalasi',
            'status' => $status, 'created_at' => now(), 'updated_at' => now(),
        ]);
        foreach (array_values($pesertaIds) as $i => $kid) {
            DB::table('spj_pesertas')->insert([
                'spj_id' => $spjId, 'karyawan_id' => $kid, 'urutan' => $i + 1,
                'nama' => "Peserta {$kid}", 'kategori_tarif' => 'Staff',
                'created_at' => now(), 'updated_at' => now(),
            ]);
        }

        return $spjId;
    }

    private function buatSpjLama(int $karyawanId, string $status): void
    {
        DB::table('pengajuan_spjs')->insert([
            'karyawan_id' => $karyawanId, 'tujuan' => 'Surabaya', 'keperluan' => 'Instalasi',
            'tgl_mulai' => '2026-01-11', 'tgl_selesai' => '2026-01-14', 'total_biaya' => 500000,
            'status_approval' => $status, 'sudah_dibayar' => false,
            'created_at' => now(), 'updated_at' => now(),
        ]);
    }

    private function absen(int $kid, string $tanggal = '2026-01-12')
    {
        return DB::table('absensis')->where('karyawan_id', $kid)->whereDate('tanggal', $tanggal)->first();
    }

    private function clockIn($user, string $koordinat)
    {
        return $this->actingAs($user)->post(route('absensi.store'), [
            'image' => self::FOTO, 'koordinat' => $koordinat, 'tipe' => 'masuk',
        ]);
    }

    public function test_service_menggabungkan_spj_lama_dan_semua_peserta_spj_baru_aktif(): void
    {
        [, $lama] = $this->buatUser(6);
        [, $p1] = $this->buatUser(6);
        [, $p2] = $this->buatUser(6);
        [, $selesai] = $this->buatUser(6);
        [, $ganda] = $this->buatUser(6);
        $this->buatSpjLama($lama, 'Menunggu Pelaporan');
        $this->buatSpjBaru([$p1, $p2, $ganda], 'Disetujui');
        $this->buatSpjBaru([$selesai], 'Selesai');
        $this->buatSpjLama($ganda, 'Selesai'); // muncul di lama & baru -> tetap satu

        // Tidak aktif: Draft, Diajukan, Ditolak, Dibatalkan, dan di luar rentang tanggal
        $tidak = [];
        foreach (['Draft', 'Diajukan', 'Ditolak', 'Dibatalkan'] as $st) {
            [, $kid] = $this->buatUser(6);
            $this->buatSpjBaru([$kid], $st);
            $tidak[] = $kid;
        }
        [, $lewat] = $this->buatUser(6);
        $this->buatSpjBaru([$lewat], 'Disetujui', '2026-01-05', '2026-01-09');
        $tidak[] = $lewat;

        $svc = app(DinasLuarService::class);
        $ids = $svc->karyawanIdsAktifPada('2026-01-12');
        sort($ids);
        $harapan = [$lama, $p1, $p2, $selesai, $ganda];
        sort($harapan);

        $this->assertSame($harapan, $ids);
        $this->assertTrue($svc->sedangDinasLuar($p2, '2026-01-12'));
        // Batas tanggal inklusif
        $this->assertTrue($svc->sedangDinasLuar($p1, '2026-01-11'));
        $this->assertTrue($svc->sedangDinasLuar($p1, '2026-01-14'));
        $this->assertFalse($svc->sedangDinasLuar($p1, '2026-01-15'));
        foreach ($tidak as $kid) {
            $this->assertFalse($svc->sedangDinasLuar($kid, '2026-01-12'));
        }
    }

    public function test_semua_peserta_spj_baru_disetujui_bypass_radius_dengan_status_dinas_luar(): void
    {
        $this->beriMenu(6, 'absensi.create');
        [$u1, $k1] = $this->buatUser(6);
        [$u2, $k2] = $this->buatUser(6);
        $this->buatSpjBaru([$k1, $k2], 'Disetujui');

        foreach ([[$u1, $k1], [$u2, $k2]] as [$user, $kid]) {
            $this->clockIn($user, self::LUAR_KOTA)->assertSessionHasNoErrors();
            $absen = $this->absen($kid);
            $this->assertNotNull($absen);
            $this->assertSame('Dinas Luar', $absen->status);
            $this->assertSame(self::LUAR_KOTA, $absen->koordinat_masuk);
            $this->assertStringContainsString('Bypass Radius: SPJ Aktif', $absen->catatan);
        }
    }

    public function test_peserta_spj_baru_belum_disetujui_tetap_ditolak_di_luar_radius(): void
    {
        $this->beriMenu(6, 'absensi.create');
        foreach (['Draft', 'Diajukan', 'Ditolak'] as $st) {
            [$user, $kid] = $this->buatUser(6);
            $this->buatSpjBaru([$kid], $st);

            $this->clockIn($user, self::LUAR_KOTA)->assertSessionHasErrors('error');
            $this->assertNull($this->absen($kid), "SPJ {$st} tidak boleh bypass radius");
        }
    }

    public function test_auto_alpha_menjadi_dinas_luar_untuk_semua_peserta_spj_baru(): void
    {
        [, $k1] = $this->buatUser(6);
        [, $k2] = $this->buatUser(6);
        [, $diajukan] = $this->buatUser(6);
        [, $ditolak] = $this->buatUser(6);
        $this->buatSpjBaru([$k1, $k2], 'Disetujui');
        $this->buatSpjBaru([$diajukan], 'Diajukan');
        $this->buatSpjBaru([$ditolak], 'Ditolak');

        $this->artisan('ldp:daily-automation', ['--tanggal' => '2026-01-12'])->assertSuccessful();
        $this->artisan('ldp:daily-automation', ['--tanggal' => '2026-01-12'])->assertSuccessful(); // idempoten

        foreach ([$k1, $k2] as $kid) {
            $this->assertSame('Dinas Luar', $this->absen($kid)->status);
            $this->assertSame('Otomatis: SPJ aktif, tanpa presensi', $this->absen($kid)->catatan);
            $this->assertSame(1, DB::table('absensis')->where('karyawan_id', $kid)->count());
        }
        $this->assertSame('Alpha', $this->absen($diajukan)->status);
        $this->assertSame('Alpha', $this->absen($ditolak)->status);
    }

    public function test_monitor_absensi_menampilkan_dinas_luar_untuk_peserta_spj_baru(): void
    {
        $this->beriMenu(3, 'absensi.index');
        [$hc] = $this->buatUser(3);
        [, $k1] = $this->buatUser(6);
        [, $k2] = $this->buatUser(6);
        [, $draf] = $this->buatUser(6);
        $this->buatSpjBaru([$k1, $k2], 'Disetujui');
        $this->buatSpjBaru([$draf], 'Draft');

        $this->actingAs($hc)->get(route('absensi.index', ['tanggal' => '2026-01-12']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('stats.dinas_luar', 2)
                ->where('absensiList', fn ($list) => collect($list)->firstWhere('id', $k2)['status_absensi'] === 'Dinas Luar'
                    && collect($list)->firstWhere('id', $draf)['status_absensi'] !== 'Dinas Luar'));
    }
}
