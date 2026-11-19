<?php

namespace Tests\Feature\Persuratan;

use App\Models\MasterTemplateSurat;
use App\Models\Pengaturan;
use App\Models\UnitPenerbitSurat;
use Database\Seeders\MasterTemplateSuratSeeder;
use Database\Seeders\PengaturanPenomoranSuratSeeder;
use Database\Seeders\PengaturanSeeder;
use Database\Seeders\UnitPenerbitSuratSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class SeederPersuratanTest extends TestCase
{
    use RefreshDatabase;

    private function template(string $kode, string $nama): int
    {
        return DB::table('master_template_surats')->insertGetId([
            'nama_template' => $nama, 'kode_surat' => $kode, 'konten' => "<p>{$nama}</p>", 'is_active' => true,
        ]);
    }

    public function test_jenis_surat_idempoten_ganti_kode_dan_tidak_menimpa(): void
    {
        $skk = $this->template('SKK', 'Surat Keterangan Kerja');
        $st = $this->template('ST', 'Surat Tugas Keluar Kota');
        $jabatanId = DB::table('jabatans')->insertGetId(['kode_jabatan' => 'CEO', 'nama_jabatan' => 'CEO', 'tunjangan' => 0]);
        DB::table('rute_approval_templates')->insert(['template_id' => $skk, 'urutan_langkah' => 1, 'jabatan_id' => $jabatanId, 'label_ttd' => 'X']);

        $this->seed(MasterTemplateSuratSeeder::class);

        // Ganti kode: id, nama, konten, rute tetap
        $sket = MasterTemplateSurat::find($skk);
        $this->assertSame('SKET', $sket->kode_surat);
        $this->assertSame('Surat Keterangan Kerja', $sket->nama_template);
        $this->assertSame(1, DB::table('rute_approval_templates')->where('template_id', $skk)->count());
        $this->assertSame('STU', MasterTemplateSurat::find($st)->kode_surat);
        $this->assertSame(count(MasterTemplateSuratSeeder::JENIS), MasterTemplateSurat::count());

        // Perubahan manual tidak tertimpa, jalankan ulang tidak menambah baris
        MasterTemplateSurat::where('kode_surat', 'SPJ-PD')->update(['nama_template' => 'SPJ Diubah HC', 'is_active' => false]);
        $this->seed(MasterTemplateSuratSeeder::class);
        $this->assertSame(count(MasterTemplateSuratSeeder::JENIS), MasterTemplateSurat::count());
        $this->assertDatabaseHas('master_template_surats', ['kode_surat' => 'SPJ-PD', 'nama_template' => 'SPJ Diubah HC', 'is_active' => false]);
    }

    public function test_bila_kode_lama_dan_baru_sama_sama_ada_tidak_ada_perubahan(): void
    {
        $skk = $this->template('SKK', 'Lama');
        $sket = $this->template('SKET', 'Baru');

        $this->seed(MasterTemplateSuratSeeder::class);

        $this->assertSame('SKK', MasterTemplateSurat::find($skk)->kode_surat);
        $this->assertSame('SKET', MasterTemplateSurat::find($sket)->kode_surat);
    }

    public function test_unit_penerbit_idempoten_terpetakan_ke_departemen_dan_tidak_menimpa(): void
    {
        foreach (['BOD', 'HC', 'FIN', 'OPM', 'GOV', 'INF', 'CRE', 'BRO', 'SLS'] as $kode) {
            DB::table('departemens')->insert(['kode_departemen' => $kode, 'nama_departemen' => $kode, 'is_wajib_logbook' => false]);
        }
        $dept = fn ($k) => DB::table('departemens')->where('kode_departemen', $k)->value('id');

        $this->seed(UnitPenerbitSuratSeeder::class);

        $this->assertSame(7, UnitPenerbitSurat::count());
        $this->assertSame($dept('GOV'), UnitPenerbitSurat::where('kode', 'LDP-GP')->value('departemen_id'));
        $this->assertSame($dept('BOD'), UnitPenerbitSurat::where('kode', 'LDP-DIR')->value('departemen_id'));
        $this->assertNull(UnitPenerbitSurat::where('kode', 'LDP-CORP')->value('departemen_id'));
        foreach (['INF', 'CRE', 'BRO', 'SLS'] as $k) {
            $this->assertFalse(UnitPenerbitSurat::where('departemen_id', $dept($k))->exists(), $k);
        }

        UnitPenerbitSurat::where('kode', 'LDP-HC')->update(['nama' => 'HC Diubah', 'is_active' => false]);
        $this->seed(UnitPenerbitSuratSeeder::class);
        $this->assertSame(7, UnitPenerbitSurat::count());
        $this->assertDatabaseHas('unit_penerbit_surats', ['kode' => 'LDP-HC', 'nama' => 'HC Diubah', 'is_active' => false]);
    }

    public function test_pengaturan_mode_dibuat_global_dan_tidak_menimpa(): void
    {
        $this->seed(PengaturanPenomoranSuratSeeder::class);
        $this->assertSame('global', Pengaturan::teks('penomoran_surat_mode'));

        Pengaturan::where('kunci', 'penomoran_surat_mode')->update(['nilai' => 'per_penerbit']);
        $this->seed(PengaturanPenomoranSuratSeeder::class);
        $this->assertSame('per_penerbit', Pengaturan::teks('penomoran_surat_mode'));
        $this->assertSame(1, Pengaturan::where('kunci', 'penomoran_surat_mode')->count());
    }

    public function test_pengaturan_seeder_tidak_menimpa_nilai_yang_sudah_diubah(): void
    {
        $this->seed(PengaturanSeeder::class);
        Pengaturan::where('kunci', 'radius_absensi')->update(['nilai' => '5000']);
        Pengaturan::where('kunci', 'denda_terlambat')->delete();

        $this->seed(PengaturanSeeder::class);

        $this->assertSame('5000', Pengaturan::teks('radius_absensi'));
        $this->assertSame('50000', Pengaturan::teks('denda_terlambat')); // kunci yang hilang dibuat lagi
        $this->assertSame('global', Pengaturan::teks('penomoran_surat_mode'));
        $this->assertSame(1, Pengaturan::where('kunci', 'radius_absensi')->count());
    }
}
