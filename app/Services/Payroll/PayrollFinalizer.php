<?php

namespace App\Services\Payroll;

use App\Models\CicilanPinjaman;
use App\Models\Payroll;
use App\Models\PengajuanSpj;

/**
 * Efek samping payroll yang baru dijalankan saat finalisasi (Draft → Disetujui):
 * cicilan kasbon menjadi Lunas & sisa pinjaman berkurang, SPJ ditandai sudah dibayar.
 * Panggil di dalam DB::transaction.
 */
class PayrollFinalizer
{
    public function finalisasi(Payroll $payroll): void
    {
        $cicilans = CicilanPinjaman::with('pinjaman')
            ->where('payroll_id', $payroll->id)->where('status_bayar', 'Belum Lunas')->get();

        foreach ($cicilans as $cicilan) {
            $cicilan->update(['status_bayar' => 'Lunas', 'tgl_bayar' => now()]);

            $pinjaman = $cicilan->pinjaman;
            $pinjaman->sisa_pinjaman = max(0, round($pinjaman->sisa_pinjaman - $cicilan->nominal_cicilan, 2));
            if ($pinjaman->sisa_pinjaman < 0.005) {
                $pinjaman->sisa_pinjaman = 0;
                $pinjaman->status = 'Lunas';
            }
            $pinjaman->save();
        }

        PengajuanSpj::where('payroll_id', $payroll->id)->update(['sudah_dibayar' => true]);

        $payroll->update(['status' => 'Disetujui']);
    }
}
