<?php

namespace App\Http\Controllers;

use App\Models\PengajuanLembur;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PengajuanLemburController extends Controller
{
    // Menampilkan riwayat lembur milik karyawan yang sedang login
    public function index(Request $request)
    {
        $user = $request->user();
        $karyawan = $user->karyawan;

        $riwayatLembur = [];
        if ($karyawan) {
            $riwayatLembur = PengajuanLembur::where('karyawan_id', $karyawan->id)
                ->orderBy('created_at', 'desc')
                ->get();
        }

        return Inertia::render('Lembur/Index', [
            'riwayatLembur' => $riwayatLembur
        ]);
    }

    // Menampilkan form pengajuan lembur
    public function create(Request $request)
    {
        return Inertia::render('Lembur/Create');
    }

    // Menyimpan data lembur yang dikirim karyawan
    public function store(Request $request)
    {
        $request->validate([
            'tanggal' => 'required|date',
            'jam_mulai' => 'required',
            'jam_selesai' => 'required',
            'deskripsi_pekerjaan' => 'required|string',
        ]);

        $user = $request->user();
        $karyawan = $user->karyawan;

        if (!$karyawan) {
            return redirect()->back()->withErrors(['error' => 'Data kepegawaian tidak ditemukan.']);
        }

        PengajuanLembur::create([
            'karyawan_id' => $karyawan->id,
            'tanggal' => $request->tanggal,
            'jam_mulai' => $request->jam_mulai,
            'jam_selesai' => $request->jam_selesai,
            'deskripsi_pekerjaan' => $request->deskripsi_pekerjaan,
            'status_approval' => 'Pending',
        ]);

        return redirect()->route('lembur.index')->with('success', 'Pengajuan lembur berhasil dikirim.');
    }

    // [ADMIN] Menampilkan daftar seluruh lembur untuk di-approve
    public function adminIndex()
    {
        $lemburs = PengajuanLembur::with('karyawan.departemen')
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('Lembur/AdminIndex', [
            'lemburs' => $lemburs
        ]);
    }

    // [ADMIN] Mengubah status approval (Disetujui / Ditolak)
    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status_approval' => 'required|in:Disetujui,Ditolak'
        ]);

        $lembur = PengajuanLembur::findOrFail($id);
        $lembur->update([
            'status_approval' => $request->status_approval
        ]);

        return redirect()->back()->with('success', 'Status pengajuan lembur berhasil diperbarui.');
    }
}
