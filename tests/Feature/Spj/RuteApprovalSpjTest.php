<?php

namespace Tests\Feature\Spj;

use App\Models\MasterTemplateSurat;
use App\Models\RuteApprovalTemplate;
use App\Models\SuratKeluar;
use Database\Seeders\MasterTemplateSuratSeeder;
use Illuminate\Support\Facades\DB;

class RuteApprovalSpjTest extends SpjTestCase
{
    private function templateSpjPd(): int
    {
        return DB::table('master_template_surats')->insertGetId([
            'nama_template' => 'SPJ Biaya Perjalanan Dinas', 'kode_surat' => 'SPJ-PD', 'konten' => '<p>x</p>',
            'gaya_kepala' => 'judul_tengah', 'is_active' => true, 'created_at' => now(), 'updated_at' => now(),
        ]);
    }

    private function rute(int $templateId): array
    {
        return RuteApprovalTemplate::where('template_id', $templateId)->orderBy('urutan_langkah')->get()
            ->map(fn ($r) => [$r->urutan_langkah, $r->tipe_penyetuju, $r->role_id, $r->jabatan_id, $r->label_ttd])->all();
    }

    private function ruteHarapan(): array
    {
        return [
            [1, 'role', 3, null, 'Diajukan Oleh'],
            [2, 'role', 4, null, 'Diperiksa Oleh'],
            [3, 'jabatan', null, $this->jabatanDirut, 'Disetujui Oleh'],
        ];
    }

    public function test_migrasi_mengisi_rute_spj_pd_hc_finance_direktur_aman_diulang_dan_bisa_dibalik(): void
    {
        $id = $this->templateSpjPd();
        $migrasi = require database_path('migrations/2026_11_21_100600_isi_rute_approval_spj_pd.php');

        $migrasi->up();
        $migrasi->up();
        $this->assertSame($this->ruteHarapan(), $this->rute($id));

        $migrasi->down();
        $this->assertSame([], $this->rute($id));
    }

    public function test_migrasi_tidak_menimpa_rute_yang_sudah_diatur(): void
    {
        $id = $this->templateSpjPd();
        RuteApprovalTemplate::create(['template_id' => $id, 'urutan_langkah' => 1, 'jabatan_id' => $this->jabatanManager, 'label_ttd' => 'Diatur HC']);

        (require database_path('migrations/2026_11_21_100600_isi_rute_approval_spj_pd.php'))->up();

        $this->assertSame([[1, 'jabatan', null, $this->jabatanManager, 'Diatur HC']], $this->rute($id));
    }

    public function test_seeder_instalasi_baru_membuat_rute_spj_pd_sekali(): void
    {
        $this->seed(MasterTemplateSuratSeeder::class);
        $this->seed(MasterTemplateSuratSeeder::class);

        $id = MasterTemplateSurat::where('kode_surat', 'SPJ-PD')->value('id');
        $this->assertSame($this->ruteHarapan(), $this->rute($id));
        // Jenis lain tidak diberi rute oleh seeder
        $this->assertSame(1, RuteApprovalTemplate::distinct()->count('template_id'));
    }

    public function test_rute_jabatan_lama_tetap_bertipe_jabatan(): void
    {
        $templateId = $this->buatTemplate('SKET');

        $rute = RuteApprovalTemplate::where('template_id', $templateId)->sole();
        $this->assertSame('jabatan', $rute->fresh()->tipe_penyetuju);
        $this->assertNull($rute->role_id);
        $this->assertFalse($rute->berbasisRole());
    }

    public function test_surat_keluar_tidak_bisa_memakai_template_berbasis_role(): void
    {
        $spjPd = $this->templateSpjPd();
        (require database_path('migrations/2026_11_21_100600_isi_rute_approval_spj_pd.php'))->up();
        $sket = $this->buatTemplate('SKET');
        $pembuat = $this->buatUser(6);

        $this->actingAs($pembuat)->get(route('keluar.create'))
            ->assertInertia(fn ($p) => $p->has('templates', 1)->where('templates.0.id', $sket));

        $this->actingAs($pembuat)->post(route('keluar.store'), [
            'template_id' => $spjPd, 'unit_penerbit_id' => $this->unit('LDP-HC')->id, 'isi_surat_final' => '<p>x</p>',
        ])->assertSessionHasErrors('template_id');
        $this->assertSame(0, SuratKeluar::count());

        // Template berbasis jabatan tetap bisa dipakai
        $this->actingAs($pembuat)->post(route('keluar.store'), [
            'template_id' => $sket, 'unit_penerbit_id' => $this->unit('LDP-HC')->id, 'isi_surat_final' => '<p>x</p>',
        ])->assertSessionHasNoErrors();
        $this->assertSame(1, SuratKeluar::count());
    }

    public function test_halaman_template_menampilkan_role_penyetuju(): void
    {
        $id = $this->templateSpjPd();
        (require database_path('migrations/2026_11_21_100600_isi_rute_approval_spj_pd.php'))->up();

        $this->actingAs($this->admin())->get(route('template.index'))
            ->assertInertia(fn ($p) => $p->where('templates.0.id', $id)
                ->where('templates.0.rute_approvals.0.tipe_penyetuju', 'role')
                ->where('templates.0.rute_approvals.0.role.nama_role', 'HC')
                ->where('templates.0.rute_approvals.1.role.nama_role', 'Finance')
                ->where('templates.0.rute_approvals.2.jabatan.kode_jabatan', 'CEO'));
    }
}
