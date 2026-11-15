<?php

namespace Tests\Feature\Keuangan;

/**
 * Fallback DynamicRolePermission memakai prefix resource penuh, sehingga akses ke satu
 * sub-modul admin tidak menembus modul admin lain (mis. payroll).
 */
class OtorisasiPayrollTest extends KeuanganTestCase
{
    private function postGenerate($user)
    {
        return $this->actingAs($user)->post(route('admin.payroll.generate'), ['bulan' => 1, 'tahun' => 2026]);
    }

    public function test_hc_dengan_menu_kepegawaian_dan_admin_lain_ditolak_generate_dan_finalize(): void
    {
        [$hc] = $this->buatUser(3);
        foreach (['karyawan.index', 'admin.cuti.index', 'admin.kinerja.index', 'admin.komponen.karyawan.index'] as $menu) {
            $this->beriMenu(3, $menu);
        }
        [, $kid] = $this->buatUser(6);
        $payroll = $this->buatPayroll($kid, 'Draft');

        $this->postGenerate($hc)->assertForbidden();
        $this->actingAs($hc)->post(route('admin.payroll.finalize', $payroll))->assertForbidden();
        $this->actingAs($hc)->post(route('admin.payroll.finalizeAll'))->assertForbidden();
        $this->actingAs($hc)->get(route('admin.payroll.index'))->assertForbidden();
    }

    public function test_supervisor_dengan_menu_approval_ditolak_generate_dan_finalize(): void
    {
        [$spv] = $this->buatUser(5);
        foreach (['admin.cuti.index', 'admin.pinjaman.index', 'admin.spj.index'] as $menu) {
            $this->beriMenu(5, $menu);
        }
        [, $kid] = $this->buatUser(6);
        $payroll = $this->buatPayroll($kid, 'Draft');

        $this->postGenerate($spv)->assertForbidden();
        $this->actingAs($spv)->post(route('admin.payroll.finalize', $payroll))->assertForbidden();
    }

    public function test_finance_dengan_menu_payroll_lolos_middleware(): void
    {
        [$fin] = $this->buatUser(4);
        $this->beriMenu(4, 'admin.payroll.index');
        [, $kid] = $this->buatUser(6);
        $payroll = $this->buatPayroll($kid, 'Draft');

        $this->assertNotEquals(403, $this->postGenerate($fin)->getStatusCode());
        $this->assertNotEquals(403, $this->actingAs($fin)->post(route('admin.payroll.finalize', $payroll))->getStatusCode());
        $this->actingAs($fin)->get(route('admin.payroll.index'))->assertOk();
    }

    public function test_admin_lolos_tanpa_menu(): void
    {
        [$admin] = $this->buatUser(1);

        $this->assertNotEquals(403, $this->postGenerate($admin)->getStatusCode());
        $this->actingAs($admin)->get(route('admin.payroll.index'))->assertOk();
    }

    public function test_menu_komponen_finance_tidak_membuka_payroll(): void
    {
        [$fin] = $this->buatUser(4);
        $this->beriMenu(4, 'admin.komponen.index');

        $this->postGenerate($fin)->assertForbidden();
        $this->actingAs($fin)->get(route('admin.komponen.index'))->assertOk();
    }

    public function test_menu_induk_karyawan_tetap_mencakup_sub_route_modulnya(): void
    {
        [$hc] = $this->buatUser(3);
        $this->beriMenu(3, 'karyawan.index');
        [, $kid] = $this->buatUser(6);

        // karyawan.dokumen.destroy / karyawan.updateGaji tidak boleh 403 palsu
        $this->assertNotEquals(403, $this->actingAs($hc)->post(route('karyawan.updateGaji', $kid), [])->getStatusCode());
    }
}
