<?php

namespace App\Http\Controllers;

use App\Models\PenilaianKinerja;
use App\Models\Karyawan;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PenilaianKinerjaController extends Controller
{
    // [HC / SUPERVISOR] Menampilkan riwayat penilaian
    public function index()
    {
        // Tarik data penilaian beserta relasi karyawan dan atasan penilainya
        $penilaians = PenilaianKinerja::with(['karyawan', 'penilai'])
            ->orderBy('periode_tahun', 'desc')
            ->orderBy('periode_bulan', 'desc')
            ->get();

        return Inertia::render('Kepegawaian/PenilaianKinerja/Index', [
            'penilaians' => $penilaians
        ]);
    }

    // [HC / SUPERVISOR] Menampilkan form input KPI
    public function create()
    {
        // Ambil daftar karyawan aktif untuk pilihan dropdown
        $karyawans = Karyawan::where('status_aktif', true)->orderBy('nama_lengkap')->get();

        return Inertia::render('Kepegawaian/PenilaianKinerja/Create', [
            'karyawans' => $karyawans
        ]);
    }

    // [HC / SUPERVISOR] Menyimpan skor KPI ke database
    public function store(Request $request)
    {
        $request->validate([
            'karyawan_id' => 'required|exists:karyawans,id',
            'penilai_id' => 'required|exists:karyawans,id|different:karyawan_id', // Penilai tidak boleh menilai dirinya sendiri
            'periode_bulan' => 'required|integer|min:1|max:12',
            'periode_tahun' => 'required|integer|min:2020|max:2040',
            'skor_kpi' => 'required|numeric|min:0|max:100',
            'catatan_evaluasi' => 'required|string',
        ]);

        PenilaianKinerja::create([
            'karyawan_id' => $request->karyawan_id,
            'penilai_id' => $request->penilai_id,
            'periode_bulan' => $request->periode_bulan,
            'periode_tahun' => $request->periode_tahun,
            'skor_kpi' => $request->skor_kpi,
            'catatan_evaluasi' => $request->catatan_evaluasi,
        ]);

        return redirect()->route('admin.kinerja.index')->with('success', 'Skor Penilaian Kinerja (KPI) berhasil disimpan.');
    }

    // [HC / ADMIN] Menghapus data penilaian
    public function destroy($id)
    {
        PenilaianKinerja::findOrFail($id)->delete();
        return redirect()->back()->with('success', 'Data penilaian berhasil dihapus.');
    }
}