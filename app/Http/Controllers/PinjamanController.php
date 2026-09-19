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
            // STATUS LANGSUNG "PENDING" UNTUK DIEKSEKUSI FINANCE
            'status' => 'Pending', 
        ]);

        return redirect()->route('pinjaman.index')->with('success', 'Pengajuan kasbon berhasil dikirim ke Departemen Finance.');
    }

    // [FINANCE/ADMIN] Menampilkan seluruh daftar pengajuan Kasbon 1 Pintu
    public function adminIndex(Request $request)
    {
        $user = $request->user();
        
        // Hanya Admin(1) dan Finance(4) yang boleh mengakses halaman ini
        if (!in_array($user->role_id, [1, 4])) {
            abort(403, 'Akses Ditolak. Halaman ini khusus untuk Departemen Finance.');
        }

        $query = PinjamanKaryawan::with(['karyawan.departemen', 'cicilans']);

        $pinjaman = $query->orderByRaw("FIELD(status, 'Pending', 'Berjalan', 'Lunas', 'Ditolak')")
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('Pinjaman/AdminIndex', [
            'pinjaman' => $pinjaman,
            'userRole' => $user->role_id
        ]);
    }

    // [FINANCE/ADMIN] Mengubah status (Approve/Reject) 1 Pintu & Generate jadwal cicilan
    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            // Finance hanya punya 2 opsi: Setuju (Berjalan) atau Tolak (Ditolak)
            'status' => 'required|in:Berjalan,Ditolak,Lunas'
        ]);

        $pinjaman = PinjamanKaryawan::findOrFail($id);
        $targetStatus = $request->status;

        DB::beginTransaction();
        try {
            // Update status ke DB
            $pinjaman->update(['status' => $targetStatus]);

            // GENERATE CICILAN JIKA FINANCE KLIK "SETUJUI & CAIRKAN" (Berjalan)
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

            // Pesan Balasan
            $pesan = 'Status pinjaman berhasil diperbarui.';
            if ($targetStatus === 'Berjalan') {
                $pesan = 'Kasbon Disetujui! Dana berhasil dicairkan dan jadwal pemotongan gaji (cicilan) otomatis telah dibuat.';
            } elseif ($targetStatus === 'Ditolak') {
                $pesan = 'Pengajuan Kasbon berhasil ditolak permanen.';
            }

            return redirect()->back()->with('success', $pesan);

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Gagal memproses pinjaman: ' . $e->getMessage()]);
        }
    }
}