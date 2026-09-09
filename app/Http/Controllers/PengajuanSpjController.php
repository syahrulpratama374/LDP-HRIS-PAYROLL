<?php

namespace App\Http\Controllers;

use App\Models\PengajuanSpj;
use App\Models\KomponenBiayaSpj;
use App\Models\Pengaturan;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PengajuanSpjController extends Controller
{
    // [KARYAWAN] Menampilkan riwayat SPJ
    public function index(Request $request)
    {
        $karyawan = $request->user()->karyawan;
        $spj = [];
        $adaUtangLaporan = false;
        
        if ($karyawan) {
            $spj = PengajuanSpj::with('komponenBiaya')
                ->where('karyawan_id', $karyawan->id)
                ->orderBy('created_at', 'desc')
                ->get();

            foreach ($spj as $item) {
                // Jika SPV sudah ACC keberangkatan, dan tanggal sudah lewat, tagih laporannya
                if ($item->status_approval === 'Menunggu Pelaporan' && date('Y-m-d') > $item->tgl_selesai && empty($item->laporan_hasil)) {
                    $adaUtangLaporan = true;
                }
            }
        }

        return Inertia::render('Spj/Index', [
            'spj' => $spj,
            'adaUtangLaporan' => $adaUtangLaporan
        ]);
    }

    // [KARYAWAN] Menyimpan laporan Pasca-SPJ (Risalah & Bon)
    public function storeLaporan(Request $request, $id)
    {
        $request->validate([
            'laporan_hasil' => 'required|string',
            'file_bukti' => 'required|file|mimes:jpg,jpeg,png,pdf|max:2048',
        ]);

        $spj = PengajuanSpj::findOrFail($id);

        $filePath = null;
        if ($request->hasFile('file_bukti')) {
            $filePath = $request->file('file_bukti')->store('spj_bukti', 'public');
        }

        $spj->update([
            'laporan_hasil' => $request->laporan_hasil,
            'file_bukti_path' => $filePath,
            'status_approval' => 'Menunggu Validasi Finance', // Terlempar ke Dasbor Finance
        ]);

        return redirect()->route('spj.index')->with('success', 'Laporan perjalanan dinas dan bukti bon berhasil diunggah.');
    }

    // [KARYAWAN] Menampilkan form pengajuan SPJ
    public function create()
    {
        return Inertia::render('Spj/Create');
    }

    // [KARYAWAN] Menyimpan data SPJ dan Rincian Biayanya
    public function store(Request $request)
    {
        $request->validate([
            'tujuan' => 'required|string|max:150',
            'keperluan' => 'required|string',
            'tgl_mulai' => 'required|date',
            'tgl_selesai' => 'required|date|after_or_equal:tgl_mulai',
            'komponen_biaya' => 'required|array|min:1',
            'komponen_biaya.*.jenis_biaya' => 'required|string',
            'komponen_biaya.*.nominal' => 'required|numeric|min:0',
        ]);

        $karyawan = $request->user()->karyawan()->with('golongan')->first();

        if (!$karyawan) return redirect()->back()->withErrors(['error' => 'Data kepegawaian tidak ditemukan.']);

        $totalBiaya = collect($request->komponen_biaya)->sum('nominal');
        $kodeGolongan = $karyawan->golongan ? $karyawan->golongan->kode_golongan : 'DEFAULT';
        $plafonSetting = Pengaturan::where('kunci', 'plafon_spj_' . $kodeGolongan)->value('nilai');
        $batasMaksimal = $plafonSetting ? (float) $plafonSetting : 1500000;

        if ($totalBiaya > $batasMaksimal) {
            return redirect()->back()->withErrors([
                'error' => 'Total pengajuan (Rp ' . number_format($totalBiaya, 0, ',', '.') . 
                           ') melebihi batas plafon SPJ untuk Golongan ' . $kodeGolongan . 
                           ' (Rp ' . number_format($batasMaksimal, 0, ',', '.') . ').'
            ]);
        }

        $spj = PengajuanSpj::create([
            'karyawan_id' => $karyawan->id,
            'tujuan' => $request->tujuan,
            'keperluan' => $request->keperluan,
            'tgl_mulai' => $request->tgl_mulai,
            'tgl_selesai' => $request->tgl_selesai,
            'total_biaya' => $totalBiaya,
            'status_approval' => 'Pending',
            'sudah_dibayar' => false,
        ]);

        foreach ($request->komponen_biaya as $komponen) {
            KomponenBiayaSpj::create([
                'pengajuan_spj_id' => $spj->id,
                'jenis_biaya' => $komponen['jenis_biaya'],
                'nominal' => $komponen['nominal'],
                'keterangan' => $komponen['keterangan'] ?? null,
            ]);
        }

        return redirect()->route('spj.index')->with('success', 'Pengajuan Perjalanan Dinas (SPJ) berhasil dikirim.');
    }

    // ==========================================
    // AREA KHUSUS ADMIN / HC / SUPERVISOR / FINANCE
    // ==========================================

    public function adminIndex(Request $request)
    {
        $user = $request->user();
        $karyawan = $user->karyawan;

        $query = PengajuanSpj::with(['karyawan.departemen', 'karyawan.jabatan', 'komponenBiaya']);

        // Logika Hierarki SPV
        if ($user->role_id == 5) {
            if (!$karyawan) abort(403, 'Akses Ditolak');
            
            $karyawanId = $karyawan->id;
            $hariIni = \Carbon\Carbon::now()->toDateString();
            $bawahanIds = \App\Models\Karyawan::where('atasan_id', $karyawanId)->pluck('id')->toArray();

            $pemberiDelegasiIds = \App\Models\DelegasiWewenang::where('penerima_id', $karyawanId)
                ->where('status', 'Aktif')
                ->whereDate('tgl_mulai', '<=', $hariIni)->whereDate('tgl_selesai', '>=', $hariIni)
                ->pluck('pemberi_id')->toArray();

            if (!empty($pemberiDelegasiIds)) {
                $bawahanTitipanIds = \App\Models\Karyawan::whereIn('atasan_id', $pemberiDelegasiIds)->pluck('id')->toArray();
                $bawahanIds = array_unique(array_merge($bawahanIds, $bawahanTitipanIds));
            }
            $query->whereIn('karyawan_id', $bawahanIds);
        }

        $spj = $query->orderByRaw("FIELD(status_approval, 'Pending', 'Menunggu Validasi Finance', 'Menunggu Pelaporan', 'Selesai', 'Ditolak')")
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('Spj/AdminIndex', [
            'spj' => $spj
        ]);
    }

    // [SUPERVISOR/FINANCE] Mengubah status approval SPJ (Tier-1 & Tier-2)
    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status_approval' => 'required|in:Menunggu Pelaporan,Selesai,Ditolak'
        ]);

        $spj = PengajuanSpj::findOrFail($id);
        $spj->update(['status_approval' => $request->status_approval]);

        $pesan = 'Status SPJ berhasil diperbarui.';
        if ($request->status_approval === 'Menunggu Pelaporan') {
            $pesan = 'Anggaran Perjalanan Dinas disetujui. Karyawan kini dapat berangkat dan harus mengunggah nota setelah kembali.';
        } elseif ($request->status_approval === 'Selesai') {
            $pesan = 'Bukti nota tervalidasi! Dana SPJ akan otomatis masuk ke perhitungan Payroll bulan ini.';
        }

        return redirect()->back()->with('success', $pesan);
    }
}   