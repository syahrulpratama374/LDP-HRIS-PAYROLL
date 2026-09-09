<?php

namespace App\Http\Controllers;

use App\Models\Payroll;
use App\Models\DetailPayroll;
use App\Models\Karyawan;
use App\Models\PengajuanLembur;
use App\Models\PengajuanSpj;
use App\Models\CicilanPinjaman;
use App\Models\Absensi;
use App\Models\PenilaianKinerja;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\DB;

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
            ->get();

        return Inertia::render('Payroll/Index', [
            'payrolls' => $payrolls,
            'filters' => ['bulan' => $bulan, 'tahun' => $tahun]
        ]);
    }

    // [ADMIN / FINANCE] Mesin Utama Kalkulator Payroll (Generate Otomatis)
    public function generate(Request $request)
    {
        $request->validate([
            'periode_bulan' => 'required|integer|min:1|max:12',
            'periode_tahun' => 'required|integer|min:2020|max:2040',
        ]);

        $bulan = $request->periode_bulan;
        $tahun = $request->periode_tahun;

        // Ambil semua karyawan aktif beserta relasi yang dibutuhkan untuk hitung pajak & gaji
        $karyawans = Karyawan::with(['jabatan', 'golongan', 'ptkp'])->where('status_aktif', true)->get();

        DB::beginTransaction();
        try {
            foreach ($karyawans as $karyawan) {
                $payroll = Payroll::firstOrCreate(
                    ['karyawan_id' => $karyawan->id, 'periode_bulan' => $bulan, 'periode_tahun' => $tahun],
                    ['status' => 'Draft']
                );

                // Immutability: Tolak generate ulang jika sudah disetujui/dibayar
                if ($payroll->status !== 'Draft') continue;

                DetailPayroll::where('payroll_id', $payroll->id)->delete();

                $totalPemasukan = 0;
                $totalPotongan = 0;

                // ==========================================
                // 1. PEMASUKAN TETAP (Gaji Pokok & Tunjangan)
                // ==========================================
                $gajiPokok = $karyawan->jabatan->gaji_pokok ?? ($karyawan->golongan->gaji_pokok ?? 0);
                $tunjanganJabatan = $karyawan->jabatan->tunjangan ?? 0;
                
                $totalPemasukan += ($gajiPokok + $tunjanganJabatan);

                DetailPayroll::create(['payroll_id' => $payroll->id, 'nama_komponen_snapshot' => 'Gaji Pokok', 'jenis' => 'Pemasukan', 'nominal' => $gajiPokok]);
                if ($tunjanganJabatan > 0) DetailPayroll::create(['payroll_id' => $payroll->id, 'nama_komponen_snapshot' => 'Tunjangan Jabatan', 'jenis' => 'Pemasukan', 'nominal' => $tunjanganJabatan]);


                // ==========================================
                // 2. PEMASUKAN VARIABEL (Lembur, SPJ, Bonus KPI)
                // ==========================================
                
                // A. LEMBUR
                $lemburs = PengajuanLembur::where('karyawan_id', $karyawan->id)->where('status_approval', 'Disetujui')->whereMonth('tanggal', $bulan)->whereYear('tanggal', $tahun)->get();
                $totalUangLembur = 0;
                foreach ($lemburs as $lembur) {
                    $jamMulai = strtotime($lembur->jam_mulai);
                    $jamSelesai = strtotime($lembur->jam_selesai);
                    $durasiJam = max(1, round(($jamSelesai - $jamMulai) / 3600));
                    $totalUangLembur += ($durasiJam * 25000); // Tarif statis Rp 25.000/jam
                }
                if ($totalUangLembur > 0) {
                    $totalPemasukan += $totalUangLembur;
                    DetailPayroll::create(['payroll_id' => $payroll->id, 'nama_komponen_snapshot' => 'Uang Lembur', 'jenis' => 'Pemasukan', 'nominal' => $totalUangLembur]);
                }

                // B. REIMBURSEMENT SPJ
            // UBAH 'Disetujui' MENJADI 'Selesai'
        $spjs = PengajuanSpj::where('karyawan_id', $karyawan->id)
            ->where('status_approval', 'Selesai')
            ->where('sudah_dibayar', false)
            ->whereMonth('tgl_selesai', $bulan)
            ->whereYear('tgl_selesai', $tahun)->get();
                $totalSpj = $spjs->sum('total_biaya');
                if ($totalSpj > 0) {
                    $totalPemasukan += $totalSpj;
                    DetailPayroll::create(['payroll_id' => $payroll->id, 'nama_komponen_snapshot' => 'Pencairan SPJ', 'jenis' => 'Pemasukan', 'nominal' => $totalSpj]);
                    foreach ($spjs as $spj) $spj->update(['sudah_dibayar' => true]);
                }

                // C. BONUS KPI (Jika skor >= 90 dapat bonus 10% dari Gaji Pokok)
                $kpi = PenilaianKinerja::where('karyawan_id', $karyawan->id)->where('periode_bulan', $bulan)->where('periode_tahun', $tahun)->first();
                if ($kpi && $kpi->skor_kpi >= 90) {
                    $bonusKpi = $gajiPokok * 0.10; // Bonus 10%
                    $totalPemasukan += $bonusKpi;
                    DetailPayroll::create(['payroll_id' => $payroll->id, 'nama_komponen_snapshot' => 'Bonus Kinerja (Skor: '.$kpi->skor_kpi.')', 'jenis' => 'Pemasukan', 'nominal' => $bonusKpi]);
                }


                // ==========================================
                // 3. POTONGAN (Kehadiran, Kasbon, BPJS, PPh21)
                // ==========================================
                
                // A. POTONGAN KEHADIRAN (Alpha / Terlambat)
                $absensiBuruk = Absensi::where('karyawan_id', $karyawan->id)
                    ->whereIn('status', ['Alpha', 'Terlambat'])
                    ->whereMonth('tanggal', $bulan)->whereYear('tanggal', $tahun)->get();
                
                $potonganAbsen = 0;
                $jmlAlpha = $absensiBuruk->where('status', 'Alpha')->count();
                $jmlTelat = $absensiBuruk->where('status', 'Terlambat')->count();

                if ($jmlAlpha > 0) $potonganAbsen += ($jmlAlpha * ($gajiPokok / 22)); // Potong gaji harian (asumsi 22 hr kerja)
                if ($jmlTelat > 0) $potonganAbsen += ($jmlTelat * 50000); // Denda telat Rp 50.000/hari
                
                if ($potonganAbsen > 0) {
                    $totalPotongan += $potonganAbsen;
                    DetailPayroll::create(['payroll_id' => $payroll->id, 'nama_komponen_snapshot' => "Potongan Absensi ($jmlAlpha Alpha, $jmlTelat Telat)", 'jenis' => 'Potongan', 'nominal' => $potonganAbsen]);
                }

                // B. CICILAN KASBON
                $cicilans = CicilanPinjaman::whereHas('pinjaman', function ($q) use ($karyawan) {
                    $q->where('karyawan_id', $karyawan->id);
                })->where('status_bayar', 'Belum Lunas')->whereMonth('jatuh_tempo', $bulan)->whereYear('jatuh_tempo', $tahun)->get();

                $totalCicilanKasbon = 0;
                foreach ($cicilans as $cicilan) {
                    $totalCicilanKasbon += $cicilan->nominal_cicilan;
                    $cicilan->update(['payroll_id' => $payroll->id, 'status_bayar' => 'Lunas']);
                    
                    $pinjaman = $cicilan->pinjaman;
                    $pinjaman->sisa_pinjaman = max(0, $pinjaman->sisa_pinjaman - $cicilan->nominal_cicilan);
                    if ($pinjaman->sisa_pinjaman == 0) $pinjaman->status = 'Lunas';
                    $pinjaman->save();
                }
                if ($totalCicilanKasbon > 0) {
                    $totalPotongan += $totalCicilanKasbon;
                    DetailPayroll::create(['payroll_id' => $payroll->id, 'nama_komponen_snapshot' => 'Cicilan Kasbon', 'jenis' => 'Potongan', 'nominal' => $totalCicilanKasbon]);
                }

                // C. BPJS (3% dari Gaji Pokok: 1% Kes, 2% JHT)
                $potonganBpjs = $gajiPokok * 0.03;
                $totalPotongan += $potonganBpjs;
                DetailPayroll::create(['payroll_id' => $payroll->id, 'nama_komponen_snapshot' => 'Iuran BPJS (Kes & JHT 3%)', 'jenis' => 'Potongan', 'nominal' => $potonganBpjs]);

                // D. PAJAK PPh 21 (Estimasi Tahunan Sederhana berdasar PTKP)
                // Setahunkan Gaji - PTKP * 5% (Jika lebih dari 0)
                $estimasiGajiTahunan = ($gajiPokok + $tunjanganJabatan) * 12;
                $ptkpTahunan = $karyawan->ptkp->nominal_neto_tahunan ?? 54000000; 
                $pkp = $estimasiGajiTahunan - $ptkpTahunan;
                
                if ($pkp > 0) {
                    $pph21Sebulan = ($pkp * 0.05) / 12; // Tarif dasar 5% dibagi 12 bulan
                    $totalPotongan += $pph21Sebulan;
                    DetailPayroll::create(['payroll_id' => $payroll->id, 'nama_komponen_snapshot' => 'Pajak PPh 21', 'jenis' => 'Potongan', 'nominal' => $pph21Sebulan]);
                }

                // ==========================================
                // 4. FINALISASI TAKE HOME PAY
                // ==========================================
                $gajiBersih = $totalPemasukan - $totalPotongan;

                $payroll->update([
                    'gaji_pokok_saat_itu' => $gajiPokok,
                    'total_pemasukan' => $totalPemasukan,
                    'total_potongan' => $totalPotongan,
                    'total_gaji_bersih' => $gajiBersih,
                ]);
            }

            DB::commit();
            return redirect()->back()->with('success', 'Kalkulasi perhitungan payroll periode ini berhasil digenerate, mencakup KPI, BPJS, PPh21, dan Absensi.');
        } catch (\Exception $e) {
            DB::rollback();
            return redirect()->back()->withErrors(['error' => 'Gagal menghitung payroll: ' . $e->getMessage()]);
        }
    }

    // [ADMIN / FINANCE] Finalisasi Status Payroll (Draft -> Selesai)
    public function finalize($id)
    {
        $payroll = Payroll::findOrFail($id);
        $payroll->update(['status' => 'Disetujui']);
        return redirect()->back()->with('success', 'Slip gaji berhasil difinalisasi dan diterbitkan.');
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
    public function show($id)
    {
        $payroll = Payroll::with(['karyawan.departemen', 'karyawan.jabatan', 'detailPayrolls'])
            ->findOrFail($id);

        return Inertia::render('Payroll/Show', [
            'payroll' => $payroll
        ]);
    }

    // [KARYAWAN & ADMIN] Mengunduh Slip Gaji (PDF)
    public function downloadPdf($id)
    {
        $payroll = Payroll::with(['karyawan.departemen', 'karyawan.jabatan', 'detailPayrolls'])
            ->findOrFail($id);

        $pdf = Pdf::loadView('pdf.slip_gaji', ['payroll' => $payroll]);
        
        $namaFile = 'Slip_Gaji_' . str_replace(' ', '_', $payroll->karyawan->nama_lengkap) . '_' . $payroll->periode_bulan . '_' . $payroll->periode_tahun . '.pdf';

        return $pdf->download($namaFile);
    }
}