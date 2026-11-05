<?php

namespace App\Http\Controllers;

use App\Models\MasterJenisCuti;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MasterJenisCutiController extends Controller
{
    public function index()
    {
        $masterCuti = MasterJenisCuti::orderBy('id', 'asc')->get();
        
        return Inertia::render('Admin/MasterCuti/Index', [
            'masterCuti' => $masterCuti
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'nama_cuti' => 'required|string|max:255',
            'kuota_default' => 'required|integer|min:1',
            'potong_cuti_tahunan' => 'required|boolean',
        ]);

        MasterJenisCuti::create($request->all());

        return redirect()->back()->with('success', 'Jenis Cuti berhasil ditambahkan.');
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'nama_cuti' => 'required|string|max:255',
            'kuota_default' => 'required|integer|min:1',
            'potong_cuti_tahunan' => 'required|boolean',
        ]);

        $cuti = MasterJenisCuti::findOrFail($id);
        $cuti->update($request->all());

        return redirect()->back()->with('success', 'Jenis Cuti berhasil diperbarui.');
    }

    public function destroy($id)
    {
        $cuti = MasterJenisCuti::findOrFail($id);
        // Proteksi: Jangan hapus jika sudah dipakai di tabel pengajuan_cutis
        if ($cuti->pengajuanCuti()->exists()) {
            return redirect()->back()->with('error', 'Gagal dihapus: Jenis cuti ini sedang digunakan dalam riwayat pengajuan.');
        }
        
        $cuti->delete();

        return redirect()->back()->with('success', 'Jenis Cuti berhasil dihapus.');
    }
}