<?php

namespace Tests\Feature\Keuangan;

use Carbon\Carbon;
use Database\Seeders\MasterTarifTerSeeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

/**
 * Absensi karyawan yang sedang SPJ (Dinas Luar): pengecualian radius geofence,
 * monitor absensi HC, Auto-Alpha -> Dinas Luar otomatis, dan guard transisi status SPJ.
 */
class AbsensiSpjTest extends KeuanganTestCase
{
    // Titik kantor (default pengaturan) dan titik ±11 km di luar radius
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
        // Senin 12 Jan 2026, 07:50 WIB (belum terlambat)
        Carbon::setTestNow(Carbon::parse('2026-01-12 07:50:00', 'Asia/Jakarta'));
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    private function buatSpj(int $karyawanId, string $status, string $mulai = '2026-01-11', string $selesai = '2026-01-14'): int
    {
        return DB::table('pengajuan_spjs')->insertGetId([
            'karyawan_id' => $karyawanId, 'tujuan' => 'Surabaya', 'keperluan' => 'Instalasi',
            'tgl_mulai' => $mulai, 'tgl_selesai' => $selesai, 'total_biaya' => 500000,
            'status_approval' => $status, 'sudah_dibayar' => false,
            'created_at' => now(), 'updated_at' => now(),
        ]);
    }

    private function clockIn($user, string $koordinat)
    {
        return $this->actingAs($user)->post(route('absensi.store'), [
            'image' => self::FOTO, 'koordinat' => $koordinat, 'tipe' => 'masuk',
        ]);
    }

    private function absen(int $kid, string $tanggal = '2026-01-12')
    {
        return DB::table('absensis')->where('karyawan_id', $kid)->whereDate('tanggal', $tanggal)->first();
    }

    public function test_karyawan_spj_aktif_di_luar_radius_tetap_bisa_absen_dengan_status_dinas_luar(): void
    {
        $this->beriMenu(6, 'absensi.create');

        // Seluruh status SPJ aktif, termasuk saat masih dalam perjalanan (Menunggu Pelaporan)
        foreach (['Menunggu Pelaporan', 'Menunggu Validasi Finance', 'Selesai'] as $status) {
            [$user, $kid] = $this->buatUser(6);
            $this->buatSpj($kid, $status);

            $this->clockIn($user, self::LUAR_KOTA)->assertSessionHasNoErrors();

            $absen = $this->absen($kid);
            $this->assertNotNull($absen, "Status SPJ {$status} harus lolos radius");
            $this->assertSame('Dinas Luar', $absen->status);
            $this->assertSame(self::LUAR_KOTA, $absen->koordinat_masuk); // koordinat tetap dicatat
            $this->assertNotNull($absen->foto_masuk_path);               // selfie tetap disimpan
            $this->assertStringContainsString('Bypass Radius: SPJ Aktif', $absen->catatan);
        }
    }

    public function test_karyawan_tanpa_spj_aktif_di_luar_radius_ditolak(): void
    {
        $this->beriMenu(6, 'absensi.create');

        [$tanpaSpj, $kidTanpa] = $this->buatUser(6);
        [$pending, $kidPending] = $this->buatUser(6);
        $this->buatSpj($kidPending, 'Pending');            // belum disetujui atasan
        [$lewat, $kidLewat] = $this->buatUser(6);
        $this->buatSpj($kidLewat, 'Menunggu Pelaporan', '2026-01-05', '2026-01-09'); // di luar rentang tanggal

        foreach ([[$tanpaSpj, $kidTanpa], [$pending, $kidPending], [$lewat, $kidLewat]] as [$user, $kid]) {
            $this->clockIn($user, self::LUAR_KOTA)->assertSessionHasErrors('error');
            $this->assertNull($this->absen($kid));
        }

        // Di dalam radius tetap Hadir seperti biasa
        $this->clockIn($tanpaSpj, self::KANTOR)->assertSessionHasNoErrors();
        $this->assertSame('Hadir', $this->absen($kidTanpa)->status);
    }

    public function test_spj_aktif_tanpa_presensi_dicatat_dinas_luar_otomatis_bukan_alpha_dan_tidak_memotong_gaji(): void
    {
        $this->seed(MasterTarifTerSeeder::class);
        DB::table('master_ptkps')->insert([
            'id' => 1, 'kode_ptkp' => 'TK/0', 'nominal_neto_tahunan' => 54_000_000, 'kategori_ter' => 'A',
            'created_at' => now(), 'updated_at' => now(),
        ]);

        [, $dinas] = $this->buatUser(6);
        [, $dinasSelfie] = $this->buatUser(6);
        [, $bolos] = $this->buatUser(6);
        [, $spjPending] = $this->buatUser(6);
        foreach ([$dinas, $dinasSelfie, $bolos, $spjPending] as $kid) {
            $this->buatGaji($kid, 8_800_000);
        }
        $this->buatSpj($dinas, 'Menunggu Pelaporan');
        $this->buatSpj($dinasSelfie, 'Menunggu Pelaporan');
        $this->buatSpj($spjPending, 'Pending');
        DB::table('absensis')->insert([
            'karyawan_id' => $dinasSelfie, 'tanggal' => '2026-01-12', 'status' => 'Dinas Luar',
            'catatan' => 'Reguler | Bypass Radius: SPJ Aktif', 'created_at' => now(), 'updated_at' => now(),
        ]);

        $this->artisan('ldp:daily-automation', ['--tanggal' => '2026-01-12'])->assertSuccessful();
        $this->artisan('ldp:daily-automation', ['--tanggal' => '2026-01-12'])->assertSuccessful(); // idempoten

        $this->assertSame('Dinas Luar', $this->absen($dinas)->status);
        $this->assertSame('Otomatis: SPJ aktif, tanpa presensi', $this->absen($dinas)->catatan);
        $this->assertSame('Reguler | Bypass Radius: SPJ Aktif', $this->absen($dinasSelfie)->catatan); // tidak ditimpa
        $this->assertSame('Alpha', $this->absen($bolos)->status);
        $this->assertSame('Alpha', $this->absen($spjPending)->status); // SPJ belum disetujui = tidak aktif
        $this->assertSame(1, DB::table('absensis')->where('karyawan_id', $dinas)->count());

        // Sabtu: tidak ada Dinas Luar otomatis (bukan hari kerja reguler)
        $this->artisan('ldp:daily-automation', ['--tanggal' => '2026-01-10'])->assertSuccessful();
        $this->assertNull($this->absen($dinas, '2026-01-10'));

        // Payroll: Dinas Luar tidak dipotong, Alpha dipotong (8.800.000 / 22 = 400.000)
        $admin = $this->buatUser(1)[0];
        $this->actingAs($admin)->post(route('admin.payroll.generate'), ['periode_bulan' => 1, 'periode_tahun' => 2026])
            ->assertSessionHasNoErrors();

        $potongan = fn (int $kid) => DB::table('detail_payrolls')
            ->join('payrolls', 'payrolls.id', '=', 'detail_payrolls.payroll_id')
            ->where('payrolls.karyawan_id', $kid)
            ->where('nama_komponen_snapshot', 'like', 'Potongan Absensi%')
            ->value('nominal');

        $this->assertNull($potongan($dinas));
        $this->assertEquals(400000, $potongan($bolos));
    }

    public function test_monitor_absensi_menampilkan_dinas_luar_untuk_spj_dalam_perjalanan(): void
    {
        $this->beriMenu(3, 'absensi.index');
        [$hc] = $this->buatUser(3);
        [, $dinas] = $this->buatUser(6);
        $this->buatSpj($dinas, 'Menunggu Pelaporan');

        $this->actingAs($hc)->get(route('absensi.index', ['tanggal' => '2026-01-12']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('stats.dinas_luar', 1)
                ->where('absensiList', fn ($list) => collect($list)->firstWhere('id', $dinas)['status_absensi'] === 'Dinas Luar'));
    }

    public function test_transisi_status_spj_dijaga(): void
    {
        [$admin] = $this->buatUser(1);
        [, $kid] = $this->buatUser(6);

        // Pending tidak boleh langsung Selesai
        $spj = $this->buatSpj($kid, 'Pending');
        $this->actingAs($admin)->post(route('admin.spj.update', $spj), ['status_approval' => 'Selesai'])
            ->assertSessionHasErrors('error');
        $this->assertSame('Pending', DB::table('pengajuan_spjs')->where('id', $spj)->value('status_approval'));

        // Pending -> Menunggu Pelaporan sah
        $this->actingAs($admin)->post(route('admin.spj.update', $spj), ['status_approval' => 'Menunggu Pelaporan'])
            ->assertSessionHasNoErrors();
        $this->assertSame('Menunggu Pelaporan', DB::table('pengajuan_spjs')->where('id', $spj)->value('status_approval'));

        // Saat dalam perjalanan, admin tidak boleh menolak/menyelesaikan sebelum laporan diunggah
        foreach (['Selesai', 'Ditolak'] as $status) {
            $this->actingAs($admin)->post(route('admin.spj.update', $spj), ['status_approval' => $status])
                ->assertSessionHasErrors('error');
        }
        $this->assertSame('Menunggu Pelaporan', DB::table('pengajuan_spjs')->where('id', $spj)->value('status_approval'));

        // Menunggu Validasi Finance -> Selesai sah; Selesai bersifat final
        DB::table('pengajuan_spjs')->where('id', $spj)->update(['status_approval' => 'Menunggu Validasi Finance']);
        $this->actingAs($admin)->post(route('admin.spj.update', $spj), ['status_approval' => 'Selesai'])
            ->assertSessionHasNoErrors();
        $this->actingAs($admin)->post(route('admin.spj.update', $spj), ['status_approval' => 'Ditolak'])
            ->assertSessionHasErrors('error');
        $this->assertSame('Selesai', DB::table('pengajuan_spjs')->where('id', $spj)->value('status_approval'));
    }

    public function test_laporan_spj_hanya_oleh_pemilik_dan_saat_menunggu_pelaporan(): void
    {
        $this->beriMenu(6, 'spj.index');
        [$pemilik, $kid] = $this->buatUser(6);
        [$lain] = $this->buatUser(6);
        $spj = $this->buatSpj($kid, 'Menunggu Pelaporan');
        $kirim = fn ($user, $id) => $this->actingAs($user)->post(route('spj.laporan', $id), [
            'laporan_hasil' => 'Instalasi selesai',
            'file_bukti' => UploadedFile::fake()->create('nota.pdf', 100, 'application/pdf'),
        ]);
        $status = fn ($id) => DB::table('pengajuan_spjs')->where('id', $id)->value('status_approval');

        // Karyawan lain tidak boleh melaporkan SPJ milik orang lain
        $kirim($lain, $spj)->assertForbidden();
        $this->assertSame('Menunggu Pelaporan', $status($spj));

        // Pemilik berhasil -> Menunggu Validasi Finance, bukti tersimpan
        $kirim($pemilik, $spj)->assertSessionHasNoErrors()->assertRedirect(route('spj.index'));
        $this->assertSame('Menunggu Validasi Finance', $status($spj));
        $path = DB::table('pengajuan_spjs')->where('id', $spj)->value('file_bukti_path');
        Storage::disk('public')->assertExists($path);

        // Tidak bisa melapor ulang / melapor pada status lain
        foreach (['Menunggu Validasi Finance', 'Pending', 'Selesai', 'Ditolak'] as $st) {
            DB::table('pengajuan_spjs')->where('id', $spj)->update(['status_approval' => $st, 'file_bukti_path' => 'lama.pdf']);
            $kirim($pemilik, $spj)->assertSessionHasErrors('error');
            $this->assertSame($st, $status($spj));
            $this->assertSame('lama.pdf', DB::table('pengajuan_spjs')->where('id', $spj)->value('file_bukti_path'));
        }
    }
}
