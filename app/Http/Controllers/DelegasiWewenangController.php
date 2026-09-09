<?php

namespace App\Http\Controllers;

use App\Models\DelegasiWewenang;
use App\Models\Karyawan;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;

class DelegasiWewenangController extends Controller
{
    // Menampilkan daftar delegasi wewenang
    public function index(Request $request)
    {
        $user = $request->user();
        $karyawan = $user->karyawan;

        $query = DelegasiWewenang::with(['pemberi.departemen', 'penerima.departemen']);

        // LOGIKA KEAMANAN: Jika Supervisor (Role 5), hanya bisa lihat miliknya sendiri
        if ($user->role_id == 5) {
            if (!$karyawan) {
                abort(403, 'Anda tidak terdaftar sebagai Karyawan.');
            }
            $query->where('pemberi_id', $karyawan->id);
        }

        $delegasis = $query->orderBy('created_at', 'desc')->get();

        // Ambil daftar kandidat pengganti (Kecuali dirinya sendiri)
        $karyawans = Karyawan::where('status_aktif', true)
            ->where('id', '!=', $karyawan ? $karyawan->id : 0)
            ->orderBy('nama_lengkap')
            ->get();

        return Inertia::render('Kepegawaian/Delegasi/Index', [
            'delegasis' => $delegasis,
            'karyawans' => $karyawans
        ]);
    }

    // Menyimpan pendelegasian baru
    public function store(Request $request)
    {
        $user = $request->user();
        $karyawan = $user->karyawan;

        // AUTO-ASSIGN: Jika SPV, paksa pemberi_id pakai ID-nya sendiri.
        // Jika Admin/HC, ambil dari input form (request->pemberi_id).
        $pemberiId = ($user->role_id == 5) ? $karyawan->id : $request->pemberi_id;

        $request->validate([
            'penerima_id' => 'required|exists:karyawans,id|different:pemberi_id',
            'tgl_mulai' => 'required|date',
            'tgl_selesai' => 'required|date|after_or_equal:tgl_mulai',
            'alasan' => 'nullable|string',
        ]);

        // CEK BENTROK JADWAL: Pastikan tidak ada delegasi aktif di tanggal yang beririsan
        $bentrok = DelegasiWewenang::where('pemberi_id', $pemberiId)
            ->where('status', 'Aktif')
            ->where(function ($query) use ($request) {
                $query->whereBetween('tgl_mulai', [$request->tgl_mulai, $request->tgl_selesai])
                      ->orWhereBetween('tgl_selesai', [$request->tgl_mulai, $request->tgl_selesai]);
            })->exists();

        if ($bentrok) {
            return redirect()->back()->withErrors(['error' => 'Anda sudah memiliki pendelegasian wewenang yang aktif pada rentang tanggal tersebut.']);
        }

        DelegasiWewenang::create([
            'pemberi_id' => $pemberiId,
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