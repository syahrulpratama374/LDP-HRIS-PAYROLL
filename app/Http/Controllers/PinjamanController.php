<?php

namespace App\Http\Controllers;

use App\Models\PinjamanKaryawan;
use App\Models\CicilanPinjaman;
use App\Models\Karyawan;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;

class PinjamanController extends Controller
{
    // Fungsi Helper Hierarki & Eskalasi Delegasi (Seperti di Modul Sebelumnya)
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

    // [ADMIN/FINANCE/SPV] Menampilkan daftar pengajuan sesuai hierarki
    public function adminIndex(Request $request)
    {
        $user = $request->user();
        $query = PinjamanKaryawan::with(['karyawan.departemen', 'cicilans']);

        // Jika SPV (Role 5), filter hanya bawahan langsungnya
        if ($user->role_id == 5 && $user->karyawan) {
            $bawahanIds = $this->getBawahanIds($user->karyawan);
            $query->whereIn('karyawan_id', $bawahanIds);
        }

        $pinjaman = $query->orderByRaw("FIELD(status, 'Pending', 'Menunggu Pencairan', 'Berjalan', 'Lunas', 'Ditolak')")
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('Pinjaman/AdminIndex', [
            'pinjaman' => $pinjaman
        ]);
    }

    // [ADMIN/FINANCE/SPV] Mengubah status & Generate jadwal cicilan otomatis (Hanya Finance)
    public function updateStatus(Request $request, $id)
    {
        // Status: Pending -> Menunggu Pencairan (Oleh SPV) -> Berjalan (Oleh Finance)
        $request->validate([
            'status' => 'required|in:Menunggu Pencairan,Berjalan,Ditolak,Lunas'
        ]);

        $pinjaman = PinjamanKaryawan::findOrFail($id);
        $pinjaman->update(['status' => $request->status]);

        // Tier 2: Jika dicairkan oleh Finance (Status: Berjalan), Generate Cicilan!
        if ($request->status === 'Berjalan' && $pinjaman->cicilans()->count() === 0) {
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

        $pesan = $request->status === 'Berjalan' 
            ? 'Dana berhasil dicairkan dan jadwal pemotongan gaji (cicilan) otomatis telah dibuat.' 
            : 'Status pinjaman berhasil diperbarui.';

        return redirect()->back()->with('success', $pesan);
    }
}