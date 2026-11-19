<?php

namespace Tests\Feature\Spj;

use App\Models\MasterTarifSpj;
use Database\Seeders\MasterTarifSpjSeeder;
use Illuminate\Support\Facades\DB;

class MasterTarifSpjTest extends SpjTestCase
{
    public function test_seeder_idempoten_tidak_menimpa_koreksi_hc_dan_lengkap_sesuai_sumber(): void
    {
        $jumlah = (count(MasterTarifSpjSeeder::UANG_HARIAN) + count(MasterTarifSpjSeeder::PENGINAPAN)) * 3;
        $this->assertSame($jumlah, MasterTarifSpj::count()); // 17*3 + 19*3 = 108

        MasterTarifSpj::where(['provinsi' => 'Jawa Timur', 'jenis' => 'uang_harian', 'kategori' => 'Staff'])->update(['nominal' => 170000]);
        $this->seed(MasterTarifSpjSeeder::class);

        $this->assertSame($jumlah, MasterTarifSpj::count());
        $this->assertEquals(170000, MasterTarifSpj::tarifBerlaku('Jawa Timur', 'uang_harian', 'Staff', '2026-08-01')->nominal);
    }

    public function test_nilai_contoh_dokumen_jawa_timur_staff(): void
    {
        $this->assertEquals(164000, MasterTarifSpj::tarifBerlaku('Jawa Timur', 'uang_harian', 'Staff', '2026-08-25')->nominal);
        $this->assertEquals(196000, MasterTarifSpj::tarifBerlaku('Jawa Timur', 'penginapan', 'Staff', '2026-08-25')->nominal);
        $this->assertEquals(987000, MasterTarifSpj::tarifBerlaku('Bali', 'penginapan', 'Direksi', '2026-08-25')->nominal);
    }

    public function test_tarif_berlaku_memilih_tanggal_berlaku_terakhir_sebelum_tanggal_berangkat(): void
    {
        MasterTarifSpj::create(['provinsi' => 'Jawa Timur', 'jenis' => 'uang_harian', 'kategori' => 'Staff', 'nominal' => 180000, 'berlaku_mulai' => '2027-01-01']);

        $this->assertEquals(164000, MasterTarifSpj::tarifBerlaku('Jawa Timur', 'uang_harian', 'Staff', '2026-12-31')->nominal);
        $this->assertEquals(180000, MasterTarifSpj::tarifBerlaku('Jawa Timur', 'uang_harian', 'Staff', '2027-01-01')->nominal);
        $this->assertNull(MasterTarifSpj::tarifBerlaku('Jawa Timur', 'uang_harian', 'Staff', '2025-12-31'));
        $this->assertNull(MasterTarifSpj::tarifBerlaku('Papua', 'uang_harian', 'Staff', '2026-08-25'));
    }

    public function test_provinsi_pilihan_hanya_yang_punya_uang_harian(): void
    {
        $provinsi = MasterTarifSpj::provinsiUangHarian();

        $this->assertCount(17, $provinsi);
        $this->assertTrue($provinsi->contains('Jawa Timur'));
        $this->assertFalse($provinsi->contains('Nusa Tenggara Barat'));
        $this->assertFalse($provinsi->contains('Nusa Tenggara Timur'));
    }

    public function test_migrasi_kategori_awal_head_tetap_staff_dan_kode_jabatan_dipetakan(): void
    {
        $md = DB::table('jabatans')->insertGetId(['kode_jabatan' => 'MD', 'nama_jabatan' => 'Managing Director', 'tunjangan' => 0]);
        $spv = DB::table('jabatans')->insertGetId(['kode_jabatan' => 'SPV', 'nama_jabatan' => 'Supervisor', 'tunjangan' => 0]);
        $u = [
            'ceo' => $this->karyawanSpj('ceo', 2, $this->jabatanDirut),
            'md' => $this->karyawanSpj('md', 2, $md),
            'yoga' => $this->karyawanSpj('yoga', 3, $this->jabatanManager),
            'fahla' => $this->karyawanSpj('fahla', 5, $this->jabatanManager),
            'mikha' => $this->karyawanSpj('mikha', 5, $this->jabatanManager),
            'elvira' => $this->karyawanSpj('elvira', 5, $this->jabatanManager),
            'anas' => $this->karyawanSpj('anas', 5, $spv),
            'staff.cre1' => $this->karyawanSpj('staff.cre1', 6, $this->jabatanStaf),
        ];

        $migrasi = require database_path('migrations/2026_11_21_100200_isi_kategori_tarif_spj_awal.php');
        $migrasi->up();

        $kategori = fn (string $username) => $u[$username]->karyawan()->value('kategori_tarif_spj');
        $this->assertSame('Direksi', $kategori('ceo'));
        $this->assertSame('Direksi', $kategori('md'));
        $this->assertSame('Manager', $kategori('yoga'));
        $this->assertSame('Staff', $kategori('fahla'));   // Head of Artistic: jenjang MGR, tarif Staff
        $this->assertSame('Staff', $kategori('mikha'));   // Head of Sales & IPrime
        $this->assertSame('Staff', $kategori('elvira'));  // Business Relation Officer
        $this->assertSame('Staff', $kategori('anas'));
        $this->assertSame('Staff', $kategori('staff.cre1'));
    }

    public function test_hc_dan_admin_bisa_mengubah_finance_hanya_melihat_karyawan_403(): void
    {
        $this->beriMenu(3, 'tarif-spj.index');
        $this->beriMenu(4, 'tarif-spj.index');
        $hc = $this->buatUser(3);
        $finance = $this->buatUser(4);
        $karyawan = $this->buatUser(6);
        $baru = ['provinsi' => 'Kalimantan Timur', 'jenis' => 'uang_harian', 'kategori' => 'Staff', 'nominal' => 150000, 'berlaku_mulai' => '2026-01-01'];

        $this->actingAs($hc)->post(route('tarif-spj.store'), $baru)->assertSessionHasNoErrors();
        $this->assertDatabaseHas('master_tarif_spjs', ['provinsi' => 'Kalimantan Timur', 'satuan' => 'OH']);
        $this->actingAs($hc)->post(route('tarif-spj.store'), $baru)->assertSessionHasErrors('berlaku_mulai'); // duplikat

        $this->actingAs($finance)->get(route('tarif-spj.index'))->assertOk()
            ->assertInertia(fn ($p) => $p->where('bolehUbah', false));
        $this->actingAs($finance)->post(route('tarif-spj.store'), ['provinsi' => 'Papua'] + $baru)->assertForbidden();
        $tarif = MasterTarifSpj::first();
        $this->actingAs($finance)->delete(route('tarif-spj.destroy', $tarif->id))->assertForbidden();

        $this->actingAs($karyawan)->get(route('tarif-spj.index'))->assertForbidden();

        $this->actingAs($this->admin())->put(route('tarif-spj.update', $tarif->id), [
            'provinsi' => $tarif->provinsi, 'jenis' => $tarif->jenis, 'kategori' => $tarif->kategori,
            'nominal' => 123456, 'berlaku_mulai' => $tarif->berlaku_mulai,
        ])->assertSessionHasNoErrors();
        $this->assertEquals(123456, $tarif->fresh()->nominal);
        $this->assertDatabaseHas('audit_trails', ['modul' => 'Master Tarif SPJ', 'aksi' => 'Ubah tarif SPJ']);
    }

    public function test_hc_mengubah_kategori_tarif_per_karyawan(): void
    {
        $this->beriMenu(3, 'tarif-spj.index');
        $this->beriMenu(4, 'tarif-spj.index');
        $hc = $this->buatUser(3);
        $target = $this->karyawanSpj('fahla', 5, $this->jabatanManager, 'Staff');

        $this->actingAs($hc)->put(route('tarif-spj.kategori', $target->karyawan->id), ['kategori_tarif_spj' => 'Manager'])
            ->assertSessionHasNoErrors();
        $this->assertSame('Manager', $target->karyawan()->value('kategori_tarif_spj'));

        $this->actingAs($hc)->put(route('tarif-spj.kategori', $target->karyawan->id), ['kategori_tarif_spj' => 'Raja'])
            ->assertSessionHasErrors('kategori_tarif_spj');
        $this->actingAs($this->buatUser(4))->put(route('tarif-spj.kategori', $target->karyawan->id), ['kategori_tarif_spj' => 'Direksi'])
            ->assertForbidden();
        $this->assertSame('Manager', $target->karyawan()->value('kategori_tarif_spj'));
    }

    public function test_migrasi_menu_menambah_tanpa_duplikat_dan_bisa_dibalik(): void
    {
        $grup = DB::table('menus')->insertGetId(['title' => 'Master Data', 'route_name' => null, 'order' => 7, 'is_active' => true]);
        $migrasi = require database_path('migrations/2026_11_21_100300_tambah_menu_master_tarif_spj.php');

        $migrasi->up();
        $migrasi->up();

        $menu = DB::table('menus')->where('route_name', 'tarif-spj.index')->get();
        $this->assertCount(1, $menu);
        $this->assertSame($grup, $menu[0]->parent_id);
        foreach ([1, 3, 4] as $role) {
            $this->assertSame(1, DB::table('role_has_menus')->where('role_id', $role)->where('menu_id', $menu[0]->id)->count());
        }
        $this->assertSame(0, DB::table('role_has_menus')->where('role_id', 6)->where('menu_id', $menu[0]->id)->count());

        $migrasi->down();
        $this->assertSame(0, DB::table('menus')->where('route_name', 'tarif-spj.index')->count());
    }
}
