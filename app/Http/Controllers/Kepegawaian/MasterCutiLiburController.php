<?php

namespace App\Http\Controllers\Kepegawaian;

use App\Http\Controllers\Controller;
use App\Models\HariLibur;
use App\Models\Pengaturan;
use App\Models\Karyawan;
use App\Models\SaldoCuti;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class MasterCutiLiburController extends Controller
{
    public function index()
    {
        $hariLiburs = HariLibur::orderBy('tanggal', 'asc')->get();
        $defaultCuti = Pengaturan::where('kunci', 'hak_cuti_default')->value('nilai') ?? 12;

        return Inertia::render('Kepegawaian/MasterCuti/Index', [
            'hariLiburs' => $hariLiburs,
            'defaultCuti' => $defaultCuti,
        ]);
    }

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

    public function storeLibur(Request $request)
    {
        $request->validate([
            'tanggal' => 'required|date|unique:hari_liburs,tanggal',
            'keterangan' => 'required|string|max:150',
            'is_cuti_bersama' => 'boolean',
        ]);

        DB::beginTransaction();
        try {
            // 1. Simpan Kalender Libur
            $libur = HariLibur::create([
                'tanggal' => $request->tanggal,
                'keterangan' => $request->keterangan,
                'is_cuti_bersama' => $request->is_cuti_bersama ?? false,
            ]);

            // 2. OTOMASI: Jika Cuti Bersama, potong saldo semua karyawan aktif
            if ($libur->is_cuti_bersama) {
                $tahun = date('Y', strtotime($libur->tanggal));
                $defaultCuti = Pengaturan::where('kunci', 'hak_cuti_default')->value('nilai') ?? 12;
                
                $karyawans = Karyawan::where('status_aktif', true)->get();

                foreach ($karyawans as $karyawan) {
                    // Cek apakah karyawan sudah punya record saldo cuti tahun ini
                    $saldo = SaldoCuti::firstOrCreate(
                        ['karyawan_id' => $karyawan->id, 'tahun_periode' => $tahun],
                        ['hak_cuti_tahunan' => $defaultCuti, 'cuti_terpakai' => 0]
                    );

                    // Tambahkan 1 ke cuti terpakai
                    $saldo->increment('cuti_terpakai');
                }
            }

            DB::commit();
            $pesan = $libur->is_cuti_bersama 
                ? 'Cuti Bersama ditambahkan! Saldo cuti tahunan SELURUH karyawan aktif otomatis dipotong 1 hari.' 
                : 'Hari Libur Nasional berhasil ditambahkan ke kalender tanpa memotong saldo cuti.';

            return back()->with('success', $pesan);
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Gagal menyimpan hari libur: ' . $e->getMessage()]);
        }
    }

    public function destroyLibur($id)
    {
        $libur = HariLibur::findOrFail($id);
        
        // Catatan: Idealnya jika Cuti Bersama dihapus, saldo di-refund. 
        // Untuk fase ini kita fokus pada penghapusan kalendernya saja.
        $libur->delete();

        return back()->with('success', 'Hari libur berhasil dihapus dari kalender.');
    }
}