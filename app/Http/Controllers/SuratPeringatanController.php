<?php

namespace App\Http\Controllers;

use App\Models\SuratPeringatan;
use App\Models\Karyawan;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;

class SuratPeringatanController extends Controller
{
    // [HC / ADMIN] Menampilkan daftar Surat Peringatan
    public function index()
    {
        $suratPeringatans = SuratPeringatan::with('karyawan.departemen')
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('Kepegawaian/SuratPeringatan/Index', [
            'suratPeringatans' => $suratPeringatans
        ]);
    }

    // [HC / ADMIN] Menampilkan form pembuatan SP baru
    public function create()
    {
        // Hanya ambil karyawan yang masih aktif
        $karyawans = Karyawan::with('departemen')->where('status_aktif', true)->get();

        return Inertia::render('Kepegawaian/SuratPeringatan/Create', [
            'karyawans' => $karyawans
        ]);
    }

    // [HC / ADMIN] Menyimpan data SP dan mengunggah file
    public function store(Request $request)
    {
        $request->validate([
            'karyawan_id' => 'required|exists:karyawans,id',
            'jenis_sp' => 'required|string|max:50',
            'tgl_mulai' => 'required|date',
            'tgl_selesai' => 'required|date|after_or_equal:tgl_mulai',
            'keterangan' => 'required|string',
            'file_surat' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120', // Maks 5MB
        ]);

        $path = null;
        if ($request->hasFile('file_surat')) {
            // Simpan file ke folder storage/app/public/surat_peringatan
            $path = $request->file('file_surat')->store('surat_peringatan', 'public');
        }

        SuratPeringatan::create([
            'karyawan_id' => $request->karyawan_id,
            'jenis_sp' => $request->jenis_sp,
            'tgl_mulai' => $request->tgl_mulai,
            'tgl_selesai' => $request->tgl_selesai,
            'keterangan' => $request->keterangan,
            'file_surat_path' => $path,
        ]);

        return redirect()->route('admin.sp.index')->with('success', 'Surat Peringatan berhasil diterbitkan dan diarsipkan.');
    }

    // [HC / ADMIN] Menghapus data SP
    public function destroy($id)
    {
        $sp = SuratPeringatan::findOrFail($id);
        
        // Hapus file fisik jika ada
        if ($sp->file_surat_path) {
            Storage::disk('public')->delete($sp->file_surat_path);
        }
        
        $sp->delete();

        return redirect()->back()->with('success', 'Arsip Surat Peringatan berhasil dihapus.');
    }
}