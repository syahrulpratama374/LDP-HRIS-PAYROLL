<?php

namespace App\Http\Controllers;

use App\Models\PengajuanCuti;
use App\Models\SaldoCuti;
use App\Models\MasterJenisCuti;
use App\Models\Karyawan;
use App\Models\Absensi;
use App\Models\DelegasiWewenang;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class PengajuanCutiController extends Controller
{
    // ==========================================
    // HELPER: HITUNG HARI KERJA (REGULER VS NOC)
    // ==========================================
    private function hitungHariKerjaEfektif($tanggalMulai, $tanggalSelesai, $karyawan)
    {
        $tglMulai = Carbon::parse($tanggalMulai);
        $tglSelesai = Carbon::parse($tanggalSelesai);
        $totalHari = 0;

        // Cek apakah karyawan berasal dari Departemen NOC
        $namaDepartemen = strtolower($karyawan->departemen->nama_departemen ?? '');
        $isNoc = str_contains($namaDepartemen, 'noc');

        $currentDate = $tglMulai->copy();
        while ($currentDate->lte($tglSelesai)) {
            if ($isNoc) {
                // Karyawan NOC: Sabtu & Minggu tetap dihitung hari kerja/shift
                $totalHari++;
            } else {
                // Karyawan Reguler: Sabtu & Minggu TIDAK memotong saldo cuti
                if (!$currentDate->isWeekend()) {
                    $totalHari++;
                }
            }
            $currentDate->addDay();
        }

        return $totalHari;
    }

    // ==========================================
    // ESS KARYAWAN
    // ==========================================
    public function index()
    {
        $karyawan = Auth::user()->karyawan;
        $riwayatCuti = [];
        
        if ($karyawan) {
            $riwayatCuti = PengajuanCuti::with('masterJenisCuti')
                ->where('karyawan_id', $karyawan->id)
                ->orderBy('created_at', 'desc')
                ->get();
        }

        return Inertia::render('Kepegawaian/Cuti/Index', [
            'riwayatCuti' => $riwayatCuti
        ]);
    }

    public function create()
    {
        $karyawan = Auth::user()->karyawan;
        
        if (!$karyawan) {
            return redirect()->route('dashboard')->withErrors(['error' => 'Akun Anda tidak terhubung dengan profil Karyawan.']);
        }

        $tahunSekarang = date('Y');
        
        $saldoCuti = SaldoCuti::where('karyawan_id', $karyawan->id)
            ->where('tahun_periode', $tahunSekarang)
            ->first();

        if (!$saldoCuti) {
            $saldoCuti = [
                'hak_cuti_tahunan' => 12,
                'cuti_terpakai' => 0
            ];
        }

        $masterJenisCuti = MasterJenisCuti::all();

        return Inertia::render('Kepegawaian/Cuti/Create', [
            'saldoCuti' => $saldoCuti,
            'masterJenisCuti' => $masterJenisCuti
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'jenis_cuti_id' => 'required|exists:master_jenis_cutis,id',
            'tanggal_mulai' => 'required|date',
            'tanggal_selesai' => 'required|date|after_or_equal:tanggal_mulai',
            'alasan' => 'required|string|max:255',
            'dokumen_bukti' => 'nullable|file|mimes:jpg,png,pdf|max:2048',
        ]);

        $karyawan = Auth::user()->karyawan;
        if (!$karyawan) {
            return redirect()->back()->withErrors(['error' => 'Profil karyawan tidak ditemukan.']);
        }

        $masterCuti = MasterJenisCuti::findOrFail($request->jenis_cuti_id);

        // --- OPSI B: VALIDASI SISA SALDO CUTI AGAR TIDAK MINUS ---
        if ($masterCuti->potong_cuti_tahunan) {
            $durasiHariKerja = $this->hitungHariKerjaEfektif($request->tanggal_mulai, $request->tanggal_selesai, $karyawan);

            if ($durasiHariKerja === 0) {
                return redirect()->back()->withErrors([
                    'tanggal_mulai' => 'Pengajuan gagal: Tanggal yang Anda pilih jatuh pada hari libur (Sabtu/Minggu).'
                ]);
            }

            $tahunSekarang = date('Y');
            $saldo = SaldoCuti::where('karyawan_id', $karyawan->id)
                ->where('tahun_periode', $tahunSekarang)
                ->first();

            $hakCuti = $saldo ? $saldo->hak_cuti_tahunan : 12;
            $terpakai = $saldo ? $saldo->cuti_terpakai : 0;
            $sisaCuti = $hakCuti - $terpakai;

            if ($durasiHariKerja > $sisaCuti) {
                return redirect()->back()->withErrors([
                    'tanggal_mulai' => "Sisa cuti tahunan Anda tidak mencukupi. (Sisa Cuti: {$sisaCuti} hari, Pengajuan Hari Kerja: {$durasiHariKerja} hari)."
                ]);
            }
        }

        $dokumenPath = null;
        if ($request->hasFile('dokumen_bukti')) {
            $dokumenPath = $request->file('dokumen_bukti')->store('dokumen_cuti', 'public');
        }

        PengajuanCuti::create([
            'karyawan_id' => $karyawan->id,
            'jenis_cuti_id' => $request->jenis_cuti_id,
            'tanggal_mulai' => $request->tanggal_mulai,
            'tanggal_selesai' => $request->tanggal_selesai,
            'alasan' => $request->alasan,
            'dokumen_bukti_path' => $dokumenPath,
            'status_approval' => 'Pending',
        ]);

        return redirect()->route('cuti.index')->with('success', 'Pengajuan cuti berhasil dikirim.');
    }

    // ==========================================
    // ADMIN & APPROVAL CENTER
    // ==========================================
    public function adminIndex(Request $request)
    {
        $user = $request->user();
        $karyawan = $user->karyawan;

        $query = PengajuanCuti::with(['karyawan.departemen', 'karyawan.jabatan', 'masterJenisCuti']);

        if ($user->role_id == 5) {
            if (!$karyawan) {
                abort(403, 'Akses Ditolak: Anda tidak terdaftar sebagai Karyawan.');
            }
            
            $karyawanId = $karyawan->id;
            $hariIni = Carbon::now()->toDateString();

            $bawahanIds = Karyawan::where('atasan_id', $karyawanId)->pluck('id')->toArray();

            $pemberiDelegasiIds = DelegasiWewenang::where('penerima_id', $karyawanId)
                ->where('status', 'Aktif')
                ->whereDate('tgl_mulai', '<=', $hariIni)
                ->whereDate('tgl_selesai', '>=', $hariIni)
                ->pluck('pemberi_id')
                ->toArray();

            if (!empty($pemberiDelegasiIds)) {
                $bawahanTitipanIds = Karyawan::whereIn('atasan_id', $pemberiDelegasiIds)->pluck('id')->toArray();
                $bawahanIds = array_unique(array_merge($bawahanIds, $bawahanTitipanIds));
            }

            $query->whereIn('karyawan_id', $bawahanIds);
        }

        $pengajuan = $query->orderByRaw("FIELD(status_approval, 'Pending') DESC")
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('Kepegawaian/Cuti/AdminIndex', [
            'pengajuan' => $pengajuan
        ]);
    }

    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status_approval' => 'required|in:Disetujui,Ditolak',
        ]);

        $cuti = PengajuanCuti::with('karyawan.departemen')->findOrFail($id);
        
        if ($request->status_approval === 'Disetujui' && $cuti->status_approval !== 'Disetujui') {
            
            // --- OPSI A: HITUNG HARI KERJA EFEKTIF ---
            $totalHariKerja = $this->hitungHariKerjaEfektif($cuti->tanggal_mulai, $cuti->tanggal_selesai, $cuti->karyawan);
            $tahunSekarang = Carbon::parse($cuti->tanggal_mulai)->year;

            $masterCuti = $cuti->masterJenisCuti;

            // Potong Saldo jika dikonfigurasi potong_cuti_tahunan
            if ($masterCuti && $masterCuti->potong_cuti_tahunan) {
                $saldo = SaldoCuti::firstOrCreate(
                    [
                        'karyawan_id' => $cuti->karyawan_id,
                        'tahun_periode' => $tahunSekarang
                    ],
                    [
                        'hak_cuti_tahunan' => 12,
                        'cuti_terpakai' => 0
                    ]
                );
                
                $saldo->increment('cuti_terpakai', $totalHariKerja);
            }

            // Injeksi otomatis ke Tabel Absensi (Hanya di hari kerja efektif)
            $namaCuti = $masterCuti ? $masterCuti->nama_cuti : 'Cuti'; 
            $tglMulai = Carbon::parse($cuti->tanggal_mulai);
            $tglSelesai = Carbon::parse($cuti->tanggal_selesai);
            
            $namaDepartemen = strtolower($cuti->karyawan->departemen->nama_departemen ?? '');
            $isNoc = str_contains($namaDepartemen, 'noc');

            $currentDate = $tglMulai->copy();
            while ($currentDate->lte($tglSelesai)) {
                
                // Injeksi absensi: NOC setiap hari, Reguler hanya Senin-Jumat
                if ($isNoc || !$currentDate->isWeekend()) {
                    Absensi::updateOrCreate(
                        [
                            'karyawan_id' => $cuti->karyawan_id,
                            'tanggal' => $currentDate->toDateString()
                        ],
                        [
                            'status' => 'Cuti',
                            'catatan' => 'Cuti: ' . $namaCuti,
                            'waktu_masuk' => null, 
                            'waktu_keluar' => null,
                        ]
                    );
                }
                $currentDate->addDay();
            }
        }

        $cuti->update([
            'status_approval' => $request->status_approval
        ]);

        return redirect()->back()->with('success', 'Status cuti berhasil diperbarui.');
    }
}