<?php

namespace App\Http\Controllers;

use App\Models\PengajuanCuti;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class PengajuanCutiController extends Controller
{
    // Menampilkan riwayat cuti/izin milik karyawan yang sedang login
    public function index()
    {
        $karyawan = Auth::user()->karyawan;
        
        $riwayatCuti = PengajuanCuti::where('karyawan_id', $karyawan->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('Kepegawaian/Cuti/Index', [
            'riwayatCuti' => $riwayatCuti
        ]);
    }

    // Menampilkan form pengajuan cuti baru
    public function create()
    {
        return Inertia::render('Kepegawaian/Cuti/Create');
    }

    // Menyimpan data pengajuan cuti ke database
    public function store(Request $request)
    {
        $request->validate([
            'jenis_cuti' => 'required|string', // Contoh: Tahunan, Sakit, Izin Penting
            'tanggal_mulai' => 'required|date',
            'tanggal_selesai' => 'required|date|after_or_equal:tanggal_mulai',
            'alasan' => 'required|string|max:255',
            'dokumen_bukti' => 'nullable|file|mimes:jpg,png,pdf|max:2048', // Untuk surat dokter
        ]);

        $karyawan = Auth::user()->karyawan;
        $dokumenPath = null;

        if ($request->hasFile('dokumen_bukti')) {
            $dokumenPath = $request->file('dokumen_bukti')->store('dokumen_cuti', 'public');
        }

        PengajuanCuti::create([
            'karyawan_id' => $karyawan->id,
            'jenis_cuti' => $request->jenis_cuti,
            'tanggal_mulai' => $request->tanggal_mulai,
            'tanggal_selesai' => $request->tanggal_selesai,
            'alasan' => $request->alasan,
            'dokumen_bukti_path' => $dokumenPath,
            'status_approval' => 'Pending', // Status default saat baru diajukan
        ]);

        return redirect()->route('cuti.index')->with('success', 'Pengajuan berhasil dikirim dan menunggu persetujuan.');
    }

    // ==========================================
    // AREA KHUSUS ADMIN / HC
    // ==========================================

    // Menampilkan seluruh pengajuan cuti perusahaan
    public function adminIndex()
    {
        $pengajuanCuti = PengajuanCuti::with(['karyawan.departemen', 'karyawan.jabatan'])
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return Inertia::render('Kepegawaian/Cuti/AdminIndex', [
            'pengajuanCuti' => $pengajuanCuti
        ]);
    }

    // Mengubah status persetujuan
    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status_approval' => 'required|in:Disetujui,Ditolak',
        ]);

        $cuti = PengajuanCuti::findOrFail($id);
        
        $cuti->update([
            'status_approval' => $request->status_approval
        ]);

        return redirect()->back()->with('success', 'Status pengajuan cuti berhasil diperbarui!');
    }
}