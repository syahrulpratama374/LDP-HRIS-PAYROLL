<?php

namespace Tests\Feature\Keuangan;

use App\Models\Payroll;

class PayrollTest extends KeuanganTestCase
{
    public function test_karyawan_tidak_bisa_membuka_slip_orang_lain(): void
    {
        [$user] = $this->buatUser(6);
        $this->beriMenu(6, 'slip.show');
        [, $lain] = $this->buatUser(6);
        $slip = $this->buatPayroll($lain, 'Disetujui');

        $this->actingAs($user)->get(route('slip.show', $slip))->assertForbidden();
        $this->actingAs($user)->get(route('slip.download', $slip))->assertForbidden();
    }

    public function test_karyawan_tidak_bisa_membuka_slip_sendiri_yang_masih_draft(): void
    {
        [$user, $kid] = $this->buatUser(6);
        $this->beriMenu(6, 'slip.show');
        $draft = $this->buatPayroll($kid, 'Draft');

        $this->actingAs($user)->get(route('slip.show', $draft))->assertForbidden();
    }

    public function test_karyawan_bisa_membuka_slip_sendiri_yang_disetujui(): void
    {
        [$user, $kid] = $this->buatUser(6);
        $this->beriMenu(6, 'slip.show');
        $slip = $this->buatPayroll($kid, 'Disetujui');

        $this->actingAs($user)->get(route('slip.show', $slip))->assertOk();
    }

    public function test_finalize_hanya_dari_draft(): void
    {
        [$admin] = $this->buatUser(1);
        [, $kid] = $this->buatUser(6);
        $final = $this->buatPayroll($kid, 'Disetujui', 1);
        $draft = $this->buatPayroll($kid, 'Draft', 2);

        $this->actingAs($admin)->post(route('admin.payroll.finalize', $final))->assertSessionHasErrors('error');
        $this->actingAs($admin)->post(route('admin.payroll.finalize', $draft))->assertSessionHasNoErrors();

        $this->assertSame('Disetujui', Payroll::find($draft)->status);
        $this->assertDatabaseHas('audit_trails', ['modul' => 'Payroll', 'user_id' => $admin->id]);
    }

    public function test_finalize_massal_per_periode(): void
    {
        [$admin] = $this->buatUser(1);
        [, $k1] = $this->buatUser(6);
        [, $k2] = $this->buatUser(6);
        $a = $this->buatPayroll($k1, 'Draft', 3);
        $b = $this->buatPayroll($k2, 'Draft', 3);
        $lain = $this->buatPayroll($k1, 'Draft', 4);

        $this->actingAs($admin)->post(route('admin.payroll.finalizeAll'), ['periode_bulan' => 3, 'periode_tahun' => 2026])
            ->assertSessionHasNoErrors();

        $this->assertSame('Disetujui', Payroll::find($a)->status);
        $this->assertSame('Disetujui', Payroll::find($b)->status);
        $this->assertSame('Draft', Payroll::find($lain)->status);
    }
}
