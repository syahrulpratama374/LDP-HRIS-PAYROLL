<?php

namespace App\Http\Controllers;

use App\Models\Pengaturan;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class PengaturanController extends Controller
{
    // [ADMIN / IT] Menampilkan Halaman Pengaturan Sistem Terpusat
    public function index()
    {
        // Tarik semua data pengaturan dan ubah menjadi format key => value
        $pengaturans = Pengaturan::pluck('nilai', 'kunci')->toArray();

        // Berikan nilai default jika database masih kosong
        $defaultSettings = [
            'titik_koordinat_kantor' => $pengaturans['titik_koordinat_kantor'] ?? '-7.8014,110.3644', // Default: Yogyakarta
            'radius_absensi_meter' => $pengaturans['radius_absensi_meter'] ?? '50',
            'jam_masuk_default' => $pengaturans['jam_masuk_default'] ?? '08:00',
            'jam_keluar_default' => $pengaturans['jam_keluar_default'] ?? '17:00',
            'plafon_spj_default' => $pengaturans['plafon_spj_default'] ?? '1500000',
            'hak_cuti_default' => $pengaturans['hak_cuti_default'] ?? '12',
        ];

        return Inertia::render('Pengaturan/Index', [
            'settings' => $defaultSettings
        ]);
    }

    // [ADMIN / IT] Menyimpan Perubahan Variabel Global
    public function store(Request $request)
    {
        $data = $request->except(['_token']);

        DB::beginTransaction();
        try {
            foreach ($data as $kunci => $nilai) {
                Pengaturan::updateOrCreate(
                    ['kunci' => $kunci],
                    ['nilai' => $nilai]
                );
            }
            DB::commit();
            return redirect()->back()->with('success', 'Konfigurasi sistem inti berhasil diperbarui.');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->withErrors(['error' => 'Gagal memperbarui sistem: ' . $e->getMessage()]);
        }
    }
}