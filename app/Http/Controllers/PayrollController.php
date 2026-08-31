<?php

namespace App\Http\Controllers;

use App\Models\Payroll;
use App\Models\DetailPayroll;
use App\Models\Karyawan;
use App\Models\PengajuanLembur;
use App\Models\PengajuanSpj;
use App\Models\CicilanPinjaman;
use Illuminate\Http\Request;
use Inertia\Inertia;
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
            'periode_tahun' => 'required|integer|min:2025|max:2030',
        ]);

        $bulan = $request->periode_bulan;
        $tahun = $request->periode_tahun;

        // Ambil semua karyawan aktif yang memiliki relasi jabatan
        $karyawans = Karyawan::with(['jabatan', 'golongan'])->where('status_aktif', true)->get();

        DB::beginTransaction();
        try {
            foreach ($karyawans as $karyawan) {
                // Cek apakah payroll untuk karyawan ini di periode tersebut sudah pernah dibuat
                $payroll = Payroll::firstOrCreate(
                    [
                        'karyawan_id' => $karyawan->id,
                        'periode_bulan' => $bulan,
                        'periode_tahun' => $tahun,
                    ],
                    [
                        'status' => 'Draft'
                    ]
                );

                // Jika status sudah disetujui/dibayar, jangan timpa ulang data mutlaknya (Immutability)
                if ($payroll->status !== 'Draft') {
                    continue;
                }

                // Bersihkan detail lama jika di-generate ulang saat status masih Draft
                DetailPayroll::where('payroll_id', $payroll->id)->delete();

                $totalPemasukan = 0;
                $totalPotongan = 0;

                // 1. Komponen Tetap: Gaji Pokok & Tunjangan (diambil dari Jabatan)
                $gajiPokok = $karyawan->jabatan->gaji_pokok ?? 0;
                $tunjanganJabatan = $karyawan->jabatan->tunjangan ?? 0;

                $totalPemasukan += ($gajiPokok + $tunjanganJabatan);

                // Simpan detail Gaji Pokok
                DetailPayroll::create([
                    'payroll_id' => $payroll->id,
                    'komponen_id' => 1, // ID Master Komponen GP (Gaji Pokok)
                    'nama_komponen_snapshot' => 'Gaji Pokok',
                    'jenis' => 'Pemasukan',
                    'nominal' => $gajiPokok,
                ]);

                if ($tunjanganJabatan > 0) {
                    DetailPayroll::create([
                        'payroll_id' => $payroll->id,
                        'komponen_id' => 2, // ID Master Komponen TJ (Tunjangan)
                        'nama_komponen_snapshot' => 'Tunjangan Jabatan',
                        'jenis' => 'Pemasukan',
                        'nominal' => $tunjanganJabatan,
                    ]);
                }

                // 2. Komponen Variabel: Lembur yang disetujui pada bulan tersebut
                $lemburs = PengajuanLembur::where('karyawan_id', $karyawan->id)
                    ->where('status_approval', 'Disetujui')
                    ->whereMonth('tanggal', $bulan)
                    ->whereYear('tanggal', $tahun)
                    ->get();

                $totalUangLembur = 0;
                foreach ($lemburs as $lembur) {
                    // Hitung durasi jam (asumsi sederhana: selisih jam mulai & selesai)
                    $jamMulai = strtotime($lembur->jam_mulai);
                    $jamSelesai = strtotime($lembur->jam_selesai);
                    $durasiJam = max(1, round(($jamSelesai - $jamMulai) / 3600));

                    // Tarif lembur per jam dihitung standar (misal: Rp 25.000 / jam)
                    $tarifLembur = 25000;
                    $totalUangLembur += ($durasiJam * $tarifLembur);
                }

                if ($totalUangLembur > 0) {
                    $totalPemasukan += $totalUangLembur;
                    DetailPayroll::create([
                        'payroll_id' => $payroll->id,
                        'komponen_id' => 3, // ID LBR
                        'nama_komponen_snapshot' => 'Uang Lembur (' . count($lemburs) . ' Hari)',
                        'jenis' => 'Pemasukan',
                        'nominal' => $totalUangLembur,
                    ]);
                }

                // 3. Komponen Variabel: SPJ Perjalanan Dinas yang disetujui
                $spjs = PengajuanSpj::where('karyawan_id', $karyawan->id)
                    ->where('status_approval', 'Disetujui')
                    ->where('sudah_dibayar', false)
                    ->whereMonth('tgl_selesai', $bulan)
                    ->whereYear('tgl_selesai', $tahun)
                    ->get();

                $totalSpj = $spjs->sum('total_biaya');
                if ($totalSpj > 0) {
                    $totalPemasukan += $totalSpj;
                    DetailPayroll::create([
                        'payroll_id' => $payroll->id,
                        'komponen_id' => 4, // ID SPJ
                        'nama_komponen_snapshot' => 'Reimbursement / Pencairan SPJ',
                        'jenis' => 'Pemasukan',
                        'nominal' => $totalSpj,
                    ]);

                    // Tandai SPJ sudah dibayar agar tidak terhitung double di bulan depan
                    foreach ($spjs as $spj) {
                        $spj->update(['sudah_dibayar' => true]);
                    }
                }

                // 4. Komponen Potongan: Cicilan Kasbon / Pinjaman Bulan Berjalan
                $cicilans = CicilanPinjaman::whereHas('pinjaman', function ($q) use ($karyawan) {
                    $q->where('karyawan_id', $karyawan->id);
                })
                    ->where('status_bayar', 'Belum Lunas')
                    ->whereMonth('jatuh_tempo', $bulan)
                    ->whereYear('jatuh_tempo', $tahun)
                    ->get();

                $totalCicilanKasbon = 0;
                foreach ($cicilans as $cicilan) {
                    $totalCicilanKasbon += $cicilan->nominal_cicilan;

                    // Tandai cicilan ini terikat ke payroll_id
                    $cicilan->update([
                        'payroll_id' => $payroll->id,
                        'status_bayar' => 'Lunas'
                    ]);

                    // Kurangi sisa pinjaman di tabel induk pinjaman
                    $pinjaman = $cicilan->pinjaman;
                    $pinjaman->sisa_pinjaman = max(0, $pinjaman->sisa_pinjaman - $cicilan->nominal_cicilan);
                    if ($pinjaman->sisa_pinjaman == 0) {
                        $pinjaman->status = 'Lunas';
                    }
                    $pinjaman->save();
                }

                if ($totalCicilanKasbon > 0) {
                    $totalPotongan += $totalCicilanKasbon;
                    DetailPayroll::create([
                        'payroll_id' => $payroll->id,
                        'komponen_id' => 5, // ID KASBON
                        'nama_komponen_snapshot' => 'Potongan Cicilan Kasbon',
                        'jenis' => 'Potongan',
                        'nominal' => $totalCicilanKasbon,
                    ]);
                }

                // Hitung Gaji Bersih (Take Home Pay)
                $gajiBersih = $totalPemasukan - $totalPotongan;

                // Update Snapshot ke tabel utama payrolls
                $payroll->update([
                    'gaji_pokok_saat_itu' => $gajiPokok,
                    'total_pemasukan' => $totalPemasukan,
                    'total_potongan' => $totalPotongan,
                    'total_gaji_bersih' => $gajiBersih,
                ]);
            }

            DB::commit();
            return redirect()->back()->with('success', 'Kalkulasi perhitungan payroll periode ini berhasil digenerate.');
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
            // Hanya tampilkan yang sudah di-Finalisasi
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
}
