<?php

namespace App\Http\Controllers;

use App\Models\DelegasiWewenang;
use App\Models\Karyawan;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;

class DelegasiWewenangController extends Controller
{
    // Menampilkan daftar delegasi wewenang yang aktif maupun riwayat
    public function index()
    {
        $delegasis = DelegasiWewenang::with(['pemberi.departemen', 'penerima.departemen'])
            ->orderBy('created_at', 'desc')
            ->get();

        $karyawans = Karyawan::where('status_aktif', true)->orderBy('nama_lengkap')->get();

        return Inertia::render('Kepegawaian/Delegasi/Index', [
            'delegasis' => $delegasis,
            'karyawans' => $karyawans
        ]);
    }

    // Menyimpan pendelegasian baru
    public function store(Request $request)
    {
        $request->validate([
            'pemberi_id' => 'required|exists:karyawans,id',
            'penerima_id' => 'required|exists:karyawans,id|different:pemberi_id',
            'tgl_mulai' => 'required|date',
            'tgl_selesai' => 'required|date|after_or_equal:tgl_mulai',
            'alasan' => 'nullable|string',
        ]);

        DelegasiWewenang::create([
            'pemberi_id' => $request->pemberi_id,
            'penerima_id' => $request->penerima_id,
            'tgl_mulai' => $request->tgl_mulai,
            'tgl_selesai' => $request->tgl_selesai,
            'alasan' => $request->alasan,
            'status' => 'Aktif',
        ]);

        return redirect()->back()->with('success', 'Wewenang approval berhasil didelegasikan.');
    }

    // Mencabut atau mengubah status delegasi
    public function updateStatus($id)
    {
        $delegasi = DelegasiWewenang::findOrFail($id);
        $delegasi->update([
            'status' => $delegasi->status === 'Aktif' ? 'Dicabut' : 'Aktif'
        ]);

        return redirect()->back()->with('success', 'Status delegasi wewenang diperbarui.');
    }

    // Menghapus data delegasi
    public function destroy($id)
    {
        DelegasiWewenang::findOrFail($id)->delete();
        return redirect()->back()->with('success', 'Arsip delegasi dihapus.');
    }
}