<?php

namespace App\Http\Controllers;

use App\Models\Pengumuman;
use App\Models\Departemen;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class PengumumanController extends Controller
{
    // [ADMIN / DIREKTUR / HC] Menampilkan daftar pengumuman yang pernah dibuat
    public function index()
    {
        $pengumumans = Pengumuman::with('pembuat')
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('Pengumuman/Index', [
            'pengumumans' => $pengumumans
        ]);
    }

    // [ADMIN / DIREKTUR / HC] Menampilkan form pembuatan pengumuman
    public function create()
    {
        // Ambil data departemen untuk opsi target spesifik
        $departemens = Departemen::all();
        
        return Inertia::render('Pengumuman/Create', [
            'departemens' => $departemens
        ]);
    }

    // [ADMIN / DIREKTUR / HC] Menyimpan pengumuman (Broadcast)
    public function store(Request $request)
    {
        $request->validate([
            'judul' => 'required|string|max:255',
            'konten' => 'required|string',
            'target_audiens' => 'required|string',
            'tgl_mulai' => 'required|date',
            'tgl_selesai' => 'required|date|after_or_equal:tgl_mulai',
            'tipe_banner' => 'required|in:Info,Peringatan,Sukses',
        ]);

        Pengumuman::create([
            'judul' => $request->judul,
            'konten' => $request->konten,
            'pembuat_id' => Auth::id(),
            'target_audiens' => $request->target_audiens,
            'tgl_mulai' => $request->tgl_mulai,
            'tgl_selesai' => $request->tgl_selesai,
            'tipe_banner' => $request->tipe_banner,
            'is_aktif' => true,
        ]);

        return redirect()->route('pengumuman.index')->with('success', 'Pengumuman berhasil disiarkan.');
    }

    // [ADMIN / DIREKTUR / HC] Mematikan / Menghapus pengumuman secara paksa
    public function destroy($id)
    {
        $pengumuman = Pengumuman::findOrFail($id);
        $pengumuman->delete();

        return redirect()->back()->with('success', 'Pengumuman berhasil dicabut.');
    }

    // =========================================================================
    // FUNGSI INI AKAN DIPANGGIL OLEH DASHBOARD CONTROLLER UNTUK MENAMPILKAN BANNER
    // =========================================================================
    public static function getPengumumanAktif($departemenId = null)
    {
        $hariIni = Carbon::today('Asia/Jakarta')->toDateString();

        $query = Pengumuman::where('is_aktif', true)
            ->where('tgl_mulai', '<=', $hariIni)
            ->where('tgl_selesai', '>=', $hariIni);

        // Filter Target: Ambil yang Global ATAU yang sesuai dengan Departemen user
        if ($departemenId) {
            $query->where(function($q) use ($departemenId) {
                $q->where('target_audiens', 'Global')
                  ->orWhere('target_audiens', (string) $departemenId);
            });
        } else {
            $query->where('target_audiens', 'Global');
        }

        return $query->orderBy('created_at', 'desc')->get();
    }
}