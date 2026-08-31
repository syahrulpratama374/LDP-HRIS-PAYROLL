<?php

namespace App\Http\Controllers;

use App\Models\PinjamanKaryawan;
use App\Models\CicilanPinjaman;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;

class PinjamanController extends Controller
{
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
            'tenor_bulan' => 'required|integer|min:1|max:12', // Maksimal cicilan 12 bulan
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
            'status' => 'Pending',
        ]);

        return redirect()->route('pinjaman.index')->with('success', 'Pengajuan kasbon berhasil dikirim.');
    }

    // [ADMIN/FINANCE] Menampilkan daftar semua pengajuan
    public function adminIndex()
    {
        $pinjaman = PinjamanKaryawan::with(['karyawan.departemen', 'cicilans'])
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('Pinjaman/AdminIndex', [
            'pinjaman' => $pinjaman
        ]);
    }

    // [ADMIN/FINANCE] Mengubah status & Generate jadwal cicilan otomatis
    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:Disetujui,Ditolak,Lunas'
        ]);

        $pinjaman = PinjamanKaryawan::findOrFail($id);
        $pinjaman->update(['status' => $request->status]);

        // Jika disetujui dan cicilan belum pernah dibuat, sistem memecah cicilan secara otomatis
        if ($request->status === 'Disetujui' && $pinjaman->cicilans()->count() === 0) {
            $nominalCicilan = $pinjaman->total_pinjaman / $pinjaman->tenor_bulan;
            $jatuhTempo = Carbon::now()->addMonth(); // Cicilan pertama dimulai bulan depan

            for ($i = 1; $i <= $pinjaman->tenor_bulan; $i++) {
                CicilanPinjaman::create([
                    'pinjaman_id' => $pinjaman->id,
                    'nominal_cicilan' => $nominalCicilan,
                    'jatuh_tempo' => $jatuhTempo->copy()->addMonths($i - 1),
                    'status_bayar' => 'Belum Lunas'
                ]);
            }
        }

        return redirect()->back()->with('success', 'Status pinjaman berhasil diperbarui.');
    }
}