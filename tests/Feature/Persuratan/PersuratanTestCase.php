<?php

namespace Tests\Feature\Persuratan;

use App\Models\SuratKeluar;
use App\Models\UnitPenerbitSurat;
use App\Models\User;
use Illuminate\Foundation\Http\Middleware\PreventRequestForgery;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

/** Basis test Persuratan: data minimal lewat DB::table, FK dimatikan. */
abstract class PersuratanTestCase extends TestCase
{
    use RefreshDatabase {
        beginDatabaseTransaction as private mulaiTransaksiBawaan;
    }

    private int $seq = 0;

    protected int $deptHc;

    protected int $deptSls;

    protected int $jabatanStaf;

    protected int $jabatanDirut;

    public function beginDatabaseTransaction()
    {
        Schema::disableForeignKeyConstraints();
        $this->mulaiTransaksiBawaan();
    }

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutMiddleware(PreventRequestForgery::class);
        foreach ([1 => 'Admin', 2 => 'Direktur', 3 => 'HC', 4 => 'Finance', 5 => 'Supervisor', 6 => 'Karyawan'] as $id => $nama) {
            DB::table('roles')->insert(['id' => $id, 'nama_role' => $nama, 'created_at' => now(), 'updated_at' => now()]);
        }

        $this->deptHc = $this->buatDepartemen('HC', 'Human Capital');
        $this->deptSls = $this->buatDepartemen('SLS', 'Sales & Marketing');
        $this->jabatanStaf = DB::table('jabatans')->insertGetId(['kode_jabatan' => 'STF', 'nama_jabatan' => 'Staff Pelaksana', 'tunjangan' => 0]);
        $this->jabatanDirut = DB::table('jabatans')->insertGetId(['kode_jabatan' => 'DIR', 'nama_jabatan' => 'Direktur Utama', 'tunjangan' => 0]);

        $this->buatUnit('LDP-HC', 'Human Capital', $this->deptHc);
        $this->buatUnit('LDP-FIN', 'Finance');
        $this->buatUnit('LDP-CORP', 'Corporate');

        $this->beriMenu(6, 'keluar.index');
    }

    protected function buatDepartemen(string $kode, string $nama): int
    {
        return DB::table('departemens')->insertGetId([
            'kode_departemen' => $kode, 'nama_departemen' => $nama, 'is_wajib_logbook' => false,
        ]);
    }

    protected function buatUnit(string $kode, string $nama, ?int $departemenId = null, bool $aktif = true): UnitPenerbitSurat
    {
        return UnitPenerbitSurat::create(['kode' => $kode, 'nama' => $nama, 'departemen_id' => $departemenId, 'is_active' => $aktif]);
    }

    protected function unit(string $kode): UnitPenerbitSurat
    {
        return UnitPenerbitSurat::where('kode', $kode)->firstOrFail();
    }

    /** Buat user + karyawan. */
    protected function buatUser(int $roleId, ?int $departemenId = null, ?int $jabatanId = null): User
    {
        $n = ++$this->seq;
        $user = User::factory()->create(['role_id' => $roleId]);
        DB::table('karyawans')->insert([
            'user_id' => $user->id,
            'departemen_id' => $departemenId ?? $this->deptHc,
            'jabatan_id' => $jabatanId ?? $this->jabatanStaf, 'golongan_id' => 1, 'ptkp_id' => 1,
            'nik_internal' => "NIK{$n}",
            'nama_lengkap' => "Karyawan {$n}",
            'tempat_lahir' => 'Kediri', 'tgl_lahir' => '1995-01-01',
            'agama' => 'Islam', 'status_pernikahan' => 'Belum Menikah',
            'tgl_bergabung' => '2024-01-01',
            'no_ktp_encrypted' => 'x',
            'status_aktif' => true,
            'created_at' => now(), 'updated_at' => now(),
        ]);

        return $user;
    }

    protected function admin(): User
    {
        return User::factory()->create(['role_id' => 1]);
    }

    protected function beriMenu(int $roleId, string $routeName): void
    {
        $menuId = DB::table('menus')->insertGetId([
            'title' => $routeName, 'route_name' => $routeName,
            'order' => 0, 'is_active' => true,
            'created_at' => now(), 'updated_at' => now(),
        ]);
        DB::table('role_has_menus')->insert([
            'role_id' => $roleId, 'menu_id' => $menuId,
            'created_at' => now(), 'updated_at' => now(),
        ]);
    }

    protected function buatTemplate(string $kode, ?int $jabatanApproverId = null): int
    {
        $id = DB::table('master_template_surats')->insertGetId([
            'nama_template' => "Template {$kode}", 'kode_surat' => $kode,
            'konten' => '<p>isi</p>', 'is_active' => true,
            'created_at' => now(), 'updated_at' => now(),
        ]);
        DB::table('rute_approval_templates')->insert([
            'template_id' => $id, 'urutan_langkah' => 1,
            'jabatan_id' => $jabatanApproverId ?? $this->jabatanDirut, 'label_ttd' => 'Menyetujui',
            'created_at' => now(), 'updated_at' => now(),
        ]);

        return $id;
    }

    /** Draf surat dengan satu tahap approval (jabatan Direktur Utama). */
    protected function buatDraf(User $pembuat, string $kodeJenis, ?string $kodePenerbit = 'LDP-HC'): SuratKeluar
    {
        $templateId = DB::table('master_template_surats')->where('kode_surat', $kodeJenis)->value('id')
            ?? $this->buatTemplate($kodeJenis);

        $surat = SuratKeluar::create([
            'template_id' => $templateId,
            'unit_penerbit_id' => $kodePenerbit ? $this->unit($kodePenerbit)->id : null,
            'created_by' => $pembuat->id,
            'isi_surat_final' => '<p>isi</p>',
            'status' => 'Draft',
            'status_approval' => 'Menunggu_Approval',
        ]);
        DB::table('approval_surat_keluars')->insert([
            'surat_keluar_id' => $surat->id, 'urutan_langkah' => 1,
            'jabatan_id' => $this->jabatanDirut, 'label_ttd' => 'Menyetujui', 'status' => 'Menunggu',
            'created_at' => now(), 'updated_at' => now(),
        ]);

        return $surat;
    }

    /** Setujui sebagai Admin (bypass) dan kembalikan nomor yang terbit. */
    protected function setujui(SuratKeluar $surat, ?User $oleh = null): ?string
    {
        $this->actingAs($oleh ?? $this->admin())
            ->post(route('keluar.approve', $surat->id), ['jenis_ttd' => 'qr_code'])
            ->assertRedirect();

        return $surat->fresh()->nomor_surat;
    }

    protected function setMode(string $mode): void
    {
        DB::table('pengaturans')->updateOrInsert(['kunci' => 'penomoran_surat_mode'], ['nilai' => $mode]);
    }
}
