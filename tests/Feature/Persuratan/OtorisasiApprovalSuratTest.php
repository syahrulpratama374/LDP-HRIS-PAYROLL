<?php

namespace Tests\Feature\Persuratan;

use App\Models\SuratKeluar;
use App\Models\User;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\DB;

class OtorisasiApprovalSuratTest extends PersuratanTestCase
{
    private function approve(SuratKeluar $surat, User $oleh)
    {
        return $this->actingAs($oleh)->post(route('keluar.approve', $surat->id), ['jenis_ttd' => 'qr_code']);
    }

    private function delegasi(User $pemberi, User $penerima, string $mulai, string $selesai, string $status = 'Aktif'): void
    {
        DB::table('delegasi_wewenangs')->insert([
            'pemberi_id' => $pemberi->karyawan->id, 'penerima_id' => $penerima->karyawan->id,
            'tgl_mulai' => $mulai, 'tgl_selesai' => $selesai, 'status' => $status,
            'created_at' => now(), 'updated_at' => now(),
        ]);
    }

    private function canApprove(User $user): bool
    {
        $nilai = null;
        $this->actingAs($user)->get(route('keluar.index'))
            ->assertInertia(function ($p) use (&$nilai) {
                $nilai = $p->toArray()['props']['suratKeluars']['data'][0]['can_approve'];
            });

        return $nilai;
    }

    public function test_ceo_beda_departemen_boleh_menyetujui(): void
    {
        $surat = $this->buatDraf($this->buatUser(6, $this->deptHc), 'SKET');

        $this->assertTrue($this->canApprove($this->ceo()));
        $this->approve($surat, $this->ceo())->assertSessionHas('success');
        $this->assertSame('Terbit', $surat->fresh()->status);
    }

    public function test_manager_beda_departemen_ditolak(): void
    {
        $surat = $this->buatDraf($this->buatUser(6, $this->deptHc), 'SKET', 'LDP-HC', $this->jabatanManager);
        $managerSales = $this->buatUser(5, $this->deptSls, $this->jabatanManager);

        $this->assertFalse($this->canApprove($managerSales));
        $this->approve($surat, $managerSales)->assertForbidden();
        $this->assertSame('Draft', $surat->fresh()->status);
    }

    public function test_manager_satu_departemen_boleh(): void
    {
        $surat = $this->buatDraf($this->buatUser(6, $this->deptHc), 'SKET', 'LDP-HC', $this->jabatanManager);
        $managerHc = $this->buatUser(5, $this->deptHc, $this->jabatanManager);

        $this->assertTrue($this->canApprove($managerHc));
        $this->approve($surat, $managerHc)->assertSessionHas('success');
        $this->assertSame('Terbit', $surat->fresh()->status);
    }

    public function test_pembuat_tidak_bisa_menyetujui_suratnya_sendiri(): void
    {
        $surat = $this->buatDraf($this->ceo(), 'SKET');

        $this->assertFalse($this->canApprove($this->ceo()));
        $this->approve($surat, $this->ceo())->assertForbidden();
        $this->assertSame('Draft', $surat->fresh()->status);
    }

    public function test_admin_tidak_bisa_menyetujui_surat_keluar(): void
    {
        $surat = $this->buatDraf($this->buatUser(6), 'SKET');
        $admin = $this->admin();

        $this->assertFalse($this->canApprove($admin));
        $this->approve($surat, $admin)->assertForbidden();
        $this->assertSame('Draft', $surat->fresh()->status);
        $this->assertSame(0, DB::table('nomor_surat_terbits')->count());
    }

    public function test_penerima_delegasi_aktif_boleh_dan_pdf_menampilkan_approver_asli(): void
    {
        $surat = $this->buatDraf($this->buatUser(6, $this->deptHc), 'SKET', 'LDP-HC', $this->jabatanManager);
        $managerHc = $this->buatUser(5, $this->deptHc, $this->jabatanManager);
        $plt = $this->buatUser(6, $this->deptSls, $this->jabatanStaf);
        $this->delegasi($managerHc, $plt, now()->subDay()->toDateString(), now()->addDay()->toDateString());

        $this->assertTrue($this->canApprove($plt));
        $this->approve($surat, $plt)->assertSessionHas('success');
        $this->assertSame('Terbit', $surat->fresh()->status);

        // PDF: nama & jabatan dari yang benar-benar menyetujui (Plt), bukan jabatan langkah (Manager)
        $html = null;
        $pdfAsli = app('dompdf.wrapper');
        Pdf::shouldReceive('loadView')->once()->andReturnUsing(function ($view, $data) use (&$html, $pdfAsli) {
            $html = view($view, $data)->render();

            return $pdfAsli->loadHTML($html);
        });
        $this->actingAs($plt)->get(route('keluar.pdf', $surat->id))->assertOk();

        $this->assertStringContainsString($plt->karyawan->nama_lengkap, $html);
        $this->assertStringContainsString('Staff Pelaksana', $html);
        $this->assertStringNotContainsString('Manager / Head', $html);
    }

    public function test_delegasi_di_luar_rentang_atau_tidak_aktif_ditolak(): void
    {
        $surat = $this->buatDraf($this->buatUser(6, $this->deptHc), 'SKET', 'LDP-HC', $this->jabatanManager);
        $managerHc = $this->buatUser(5, $this->deptHc, $this->jabatanManager);
        $plt = $this->buatUser(6, $this->deptSls, $this->jabatanStaf);
        $this->delegasi($managerHc, $plt, now()->subDays(10)->toDateString(), now()->subDay()->toDateString());
        $this->delegasi($managerHc, $plt, now()->subDay()->toDateString(), now()->addDay()->toDateString(), 'Dicabut');

        $this->assertFalse($this->canApprove($plt));
        $this->approve($surat, $plt)->assertForbidden();
        $this->assertSame('Draft', $surat->fresh()->status);
    }
}
