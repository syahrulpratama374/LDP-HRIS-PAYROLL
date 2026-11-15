<?php

namespace App\Http\Controllers;

use App\Models\Payroll;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Models\AuditTrail;
use App\Services\Payroll\PayrollCalculator;
use App\Services\Payroll\PayrollFinalizer;

class PayrollController extends Controller
{
    // [ADMIN / FINANCE] Menampilkan daftar rekapitulasi payroll bulanan
    public function index(Request $request)
    {
        $bulan = $request->input('bulan', date('m'));
        $tahun = $request->input('tahun', date('Y'));

        $payrolls = Payroll::with(['karyawan.departemen', 'detailPayrolls'])
            ->where('periode_bulan', $bulan)
            ->where('periode_tahun', $tahun)
            ->orderByRaw("CASE status WHEN 'Draft' THEN 0 WHEN 'Disetujui' THEN 1 ELSE 2 END")
            ->get();

        return Inertia::render('Payroll/Index', [
            'payrolls' => $payrolls,
            'filters' => ['bulan' => $bulan, 'tahun' => $tahun]
        ]);
    }

    // [ADMIN / FINANCE] Generate payroll periode (hanya Draft; idempoten) — logika ada di PayrollCalculator
    public function generate(Request $request, PayrollCalculator $calculator)
    {
        $request->validate([
            'periode_bulan' => 'required|integer|min:1|max:12',
            'periode_tahun' => 'required|integer|min:2020|max:2040',
        ]);

        try {
            $hasil = $calculator->generate((int) $request->periode_bulan, (int) $request->periode_tahun);
        } catch (\Throwable $e) {
            Log::error('Gagal menghitung payroll: ' . $e->getMessage(), [
                'bulan' => $request->periode_bulan, 'tahun' => $request->periode_tahun,
            ]);
            return redirect()->back()->withErrors(['error' => 'Gagal menghitung payroll. Silakan coba lagi atau hubungi administrator.']);
        }

        $pesan = "Payroll periode ini berhasil dihitung untuk {$hasil['diproses']} karyawan (Draft).";
        if ($hasil['dilewati'] > 0) {
            $pesan .= " {$hasil['dilewati']} slip yang sudah final dilewati.";
        }
        $redirect = redirect()->back()->with('success', $pesan);
        if ($hasil['peringatan']) {
            $redirect->with('warning', implode(' | ', array_slice($hasil['peringatan'], 0, 5)));
        }

        return $redirect;
    }

    // [ADMIN / FINANCE] Finalisasi Status Payroll (hanya dari Draft)
    public function finalize(Request $request, $id, PayrollFinalizer $finalizer)
    {
        $payroll = Payroll::findOrFail($id);

        if ($payroll->status !== 'Draft') {
            return redirect()->back()->withErrors(['error' => 'Hanya payroll berstatus Draft yang dapat difinalisasi.']);
        }

        DB::transaction(function () use ($payroll, $request, $finalizer) {
            $finalizer->finalisasi($payroll);
            $this->catatAudit($request, $payroll, 'Finalisasi slip gaji');
        });

        return redirect()->back()->with('success', 'Slip gaji berhasil difinalisasi dan diterbitkan.');
    }

    // [ADMIN / FINANCE] Finalisasi massal seluruh Draft pada satu periode
    public function finalizeAll(Request $request, PayrollFinalizer $finalizer)
    {
        $request->validate([
            'periode_bulan' => 'required|integer|min:1|max:12',
            'periode_tahun' => 'required|integer|min:2020|max:2040',
        ]);

        $jumlah = DB::transaction(function () use ($request, $finalizer) {
            $drafts = Payroll::where('periode_bulan', $request->periode_bulan)
                ->where('periode_tahun', $request->periode_tahun)
                ->where('status', 'Draft')
                ->lockForUpdate()
                ->get();

            foreach ($drafts as $payroll) {
                $finalizer->finalisasi($payroll);
                $this->catatAudit($request, $payroll, 'Finalisasi massal slip gaji');
            }

            return $drafts->count();
        });

        if ($jumlah === 0) {
            return redirect()->back()->withErrors(['error' => 'Tidak ada payroll Draft pada periode ini.']);
        }

        return redirect()->back()->with('success', "{$jumlah} slip gaji berhasil difinalisasi.");
    }

    private function catatAudit(Request $request, Payroll $payroll, string $aksi): void
    {
        AuditTrail::create([
            'user_id' => $request->user()->id,
            'modul' => 'Payroll',
            'aksi' => "{$aksi} #{$payroll->id} ({$payroll->periode_bulan}/{$payroll->periode_tahun})",
            'data_lama' => json_encode(['status' => 'Draft']),
            'data_baru' => json_encode(['status' => 'Disetujui']),
            'waktu' => now(),
        ]);
    }

    // [KARYAWAN] Menampilkan riwayat slip gaji bulanan
    public function myPayslips(Request $request)
    {
        $karyawan = $request->user()->karyawan;
        $payrolls = [];

        if ($karyawan) {
            $payrolls = Payroll::where('karyawan_id', $karyawan->id)
                ->where('status', 'Disetujui')
                ->orderBy('periode_tahun', 'desc')
                ->orderBy('periode_bulan', 'desc')
                ->get();
        }

        return Inertia::render('Payroll/MyPayslips', [
            'payrolls' => $payrolls
        ]);
    }

    // [KARYAWAN & ADMIN] Menampilkan detail Slip Gaji (Untuk dicetak)
    public function show(Request $request, $id)
    {
        $payroll = Payroll::with(['karyawan.departemen', 'karyawan.jabatan', 'detailPayrolls'])
            ->findOrFail($id);
        $this->authorizeSlip($request, $payroll);

        return Inertia::render('Payroll/Show', [
            'payroll' => $payroll
        ]);
    }

    // [KARYAWAN & ADMIN] Mengunduh Slip Gaji (PDF)
    public function downloadPdf(Request $request, $id)
    {
        $payroll = Payroll::with(['karyawan.departemen', 'karyawan.jabatan', 'detailPayrolls'])
            ->findOrFail($id);
        $this->authorizeSlip($request, $payroll);

        $pdf = Pdf::loadView('pdf.slip_gaji', ['payroll' => $payroll]);
        
        $namaFile = 'Slip_Gaji_' . str_replace(' ', '_', $payroll->karyawan->nama_lengkap) . '_' . $payroll->periode_bulan . '_' . $payroll->periode_tahun . '.pdf';

        return $pdf->download($namaFile);
    }

    // Admin/Finance boleh melihat semua slip; selain itu hanya slip milik sendiri yang sudah Disetujui
    private function authorizeSlip(Request $request, Payroll $payroll): void
    {
        $user = $request->user();
        if (in_array((int) $user->role_id, [1, 4])) {
            return;
        }

        $karyawan = $user->karyawan;
        if (!$karyawan || $payroll->karyawan_id !== $karyawan->id || $payroll->status !== 'Disetujui') {
            abort(403, 'Anda tidak berhak mengakses slip gaji ini.');
        }
    }
}
