<?php

namespace App\Http\Controllers;

use App\Models\PinjamanKaryawan;
use App\Models\CicilanPinjaman;
use App\Models\Karyawan;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class PinjamanController extends Controller
{
    // Fungsi Helper Hierarki & Eskalasi Delegasi 
    private function getBawahanIds($karyawan)
    {
        $karyawanId = $karyawan->id;
        $hariIni = Carbon::now()->toDateString();

        $bawahanIds = Karyawan::where('atasan_id', $karyawanId)->pluck('id')->toArray();

        $pemberiDelegasiIds = \App\Models\DelegasiWewenang::where('penerima_id', $karyawanId)
            ->where('status', 'Aktif')
            ->whereDate('tgl_mulai', '<=', $hariIni)
            ->whereDate('tgl_selesai', '>=', $hariIni)
            ->pluck('pemberi_id')
            ->toArray();

        if (!empty($pemberiDelegasiIds)) {
            $bawahanTitipanIds = Karyawan::whereIn('atasan_id', $pemberiDelegasiIds)->pluck('id')->toArray();
            $bawahanIds = array_unique(array_merge($bawahanIds, $bawahanTitipanIds));
        }

        return $bawahanIds;
    }

    // [KARYAWAN] Menampilkan riwayat kasbon/pinjaman
    public function index(Request $request)
    {
        $karyawan = $request->user()->karyawan;
        $pinjaman = [];
        
        if ($karyawan) {
            $pinjaman = PinjamanKaryawan::with('cicilans')
                ->where('karyawan_id', $karyawan->id)
                ->orderBy('created_at', 'desc')
                ->get();
        }

        return Inertia::render('Pinjaman/Index', [
            'pinjaman' => $pinjaman
        ]);
    }

    // [KARYAWAN] Menampilkan form pengajuan
    public function create()
    {
        return Inertia::render('Pinjaman/Create');
    }

    // [KARYAWAN] Menyimpan data pengajuan baru
    public function store(Request $request)
    {
        $request->validate([
            'total_pinjaman' => 'required|numeric|min:50000',
            'tenor_bulan' => 'required|integer|min:1|max:12',
        ]);

        $karyawan = $request->user()->karyawan;

        if (!$karyawan) {
            return redirect()->back()->withErrors(['error' => 'Data kepegawaian tidak ditemukan.']);
        }

        PinjamanKaryawan::create([
            'karyawan_id' => $karyawan->id,
            'total_pinjaman' => $request->total_pinjaman,
            'tenor_bulan' => $request->tenor_bulan,
            'sisa_pinjaman' => $request->total_pinjaman,
            'status' => 'Pending', // Menunggu SPV
        ]);

        return redirect()->route('pinjaman.index')->with('success', 'Pengajuan kasbon berhasil dikirim ke atasan Anda.');
    }

    // [ADMIN/FINANCE/SPV/DIREKTUR] Menampilkan daftar pengajuan sesuai hierarki
    public function adminIndex(Request $request)
    {
        $user = $request->user();
        $query = PinjamanKaryawan::with(['karyawan.departemen', 'cicilans']);

        // Filter SPV (Role 5)
        if ($user->role_id == 5 && $user->karyawan) {
            $bawahanIds = $this->getBawahanIds($user->karyawan);
            $query->whereIn('karyawan_id', $bawahanIds);
        } 
        // Filter Direktur (Role 2) - Hanya melihat yang sudah dilempar Finance
        elseif ($user->role_id == 2) {
            $query->where('status', 'Menunggu Approval Direktur');
        }

        $pinjaman = $query->orderByRaw("FIELD(status, 'Pending', 'Menunggu Pencairan', 'Menunggu Approval Direktur', 'Berjalan', 'Lunas', 'Ditolak')")
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('Pinjaman/AdminIndex', [
            'pinjaman' => $pinjaman,
            'userRole' => $user->role_id // Kirim Role ID ke React
        ]);
    }

    // [ADMIN/FINANCE/SPV/DIREKTUR] Mengubah status & Generate jadwal cicilan otomatis
    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:Menunggu Pencairan,Berjalan,Ditolak,Lunas'
        ]);

        $pinjaman = PinjamanKaryawan::findOrFail($id);
        $userRole = $request->user()->role_id;
        $targetStatus = $request->status;

        DB::beginTransaction();
        try {
            // LOGIKA THRESHOLD: Jika Finance (Role 4) mencoba mencairkan dana > 5 Juta
            if ($userRole == 4 && $targetStatus === 'Berjalan') {
                $threshold = 5000000; // Rp 5.000.000
                if ($pinjaman->total_pinjaman > $threshold) {
                    // Paksa status berubah menjadi menunggu Direktur, jangan cairkan dulu
                    $targetStatus = 'Menunggu Approval Direktur';
                }
            }

            // Update status ke DB
            $pinjaman->update(['status' => $targetStatus]);

            // GENERATE CICILAN JIKA STATUS FIX 'BERJALAN' 
            // (Artinya sudah di-ACC Finance untuk <5jt, ATAU sudah di-ACC Direktur untuk >5jt)
            if ($targetStatus === 'Berjalan' && $pinjaman->cicilans()->count() === 0) {
                $nominalCicilan = $pinjaman->total_pinjaman / $pinjaman->tenor_bulan;
                $jatuhTempo = Carbon::now()->addMonth(); // Pemotongan gaji dimulai bulan depan

                for ($i = 1; $i <= $pinjaman->tenor_bulan; $i++) {
                    CicilanPinjaman::create([
                        'pinjaman_id' => $pinjaman->id,
                        'nominal_cicilan' => $nominalCicilan,
                        'jatuh_tempo' => $jatuhTempo->copy()->addMonths($i - 1),
                        'status_bayar' => 'Belum Lunas'
                    ]);
                }
            }

            DB::commit();

            // Set Pesan Balasan yang Dinamis
            $pesan = 'Status pinjaman berhasil diperbarui.';
            if ($targetStatus === 'Menunggu Approval Direktur') {
                $pesan = 'Pengajuan melampaui wewenang (Rp 5 Juta). Dokumen otomatis diteruskan ke Direktur untuk Final Approval.';
            } elseif ($targetStatus === 'Berjalan') {
                $pesan = 'Dana berhasil dicairkan dan jadwal pemotongan gaji (cicilan) otomatis telah dibuat.';
            }

            return redirect()->back()->with('success', $pesan);

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Gagal memproses pinjaman: ' . $e->getMessage()]);
        }
    }
}