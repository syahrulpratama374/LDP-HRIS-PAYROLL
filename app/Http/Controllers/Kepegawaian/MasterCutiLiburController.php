<?php

namespace App\Http\Controllers\Kepegawaian;

use App\Http\Controllers\Controller;
use App\Models\HariLibur;
use App\Models\Pengaturan;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MasterCutiLiburController extends Controller
{
    // Menampilkan halaman pengaturan cuti dan daftar hari libur
    public function index()
    {
        $hariLiburs = HariLibur::orderBy('tanggal', 'asc')->get();
        $defaultCuti = Pengaturan::where('kunci', 'hak_cuti_default')->value('nilai') ?? 12;

        return Inertia::render('Kepegawaian/MasterCuti/Index', [
            'hariLiburs' => $hariLiburs,
            'defaultCuti' => $defaultCuti,
        ]);
    }

    // Menyimpan atau memperbarui jatah cuti default perusahaan
    public function updateDefaultCuti(Request $request)
    {
        $request->validate([
            'hak_cuti_default' => 'required|integer|min:0|max:30',
        ]);

        Pengaturan::updateOrCreate(
            ['kunci' => 'hak_cuti_default'],
            ['nilai' => $request->hak_cuti_default, 'keterangan' => 'Jatah hak cuti tahunan default untuk karyawan']
        );

        return back()->with('success', 'Jatah cuti default perusahaan berhasil diperbarui!');
    }

    // Menambah Hari Libur Nasional / Cuti Bersama baru
    public function storeLibur(Request $request)
    {
        $request->validate([
            'tanggal' => 'required|date|unique:hari_liburs,tanggal',
            'keterangan' => 'required|string|max:150',
            'is_cuti_bersama' => 'boolean',
        ]);

        HariLibur::create([
            'tanggal' => $request->tanggal,
            'keterangan' => $request->keterangan,
            'is_cuti_bersama' => $request->is_cuti_bersama ?? false,
        ]);

        return back()->with('success', 'Hari libur berhasil ditambahkan ke kalender perusahaan!');
    }

    // Menghapus Hari Libur
    public function destroyLibur($id)
    {
        $libur = HariLibur::findOrFail($id);
        $libur->delete();

        return back()->with('success', 'Hari libur berhasil dihapus.');
    }
}