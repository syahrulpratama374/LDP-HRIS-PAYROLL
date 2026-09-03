<?php

namespace App\Http\Controllers\Persuratan;

use App\Http\Controllers\Controller;
use App\Models\SuratKeluar;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class SuratKeluarController extends Controller
{
    /**
     * Menampilkan daftar surat keluar
     */
    public function index()
    {
        $suratKeluars = SuratKeluar::with(['template', 'karyawan', 'pembuat'])
            ->latest()
            ->paginate(10);

        return Inertia::render('Persuratan/Keluar/Index', [
            'suratKeluars' => $suratKeluars
        ]);
    }

    /**
     * Menampilkan form pembuatan surat (Draft)
     */
    public function create()
    {
        $templates = \App\Models\MasterTemplateSurat::where('is_active', true)->get();
        $karyawans = \App\Models\Karyawan::select('id', 'nama_lengkap', 'nik')->get();

        return Inertia::render('Persuratan/Keluar/Create', [
            'templates' => $templates,
            'karyawans' => $karyawans
        ]);
    }

    /**
     * Menyimpan data form sebagai Draft Surat
     */
    public function store(Request $request)
    {
        $request->validate([
            'template_id' => 'required|exists:master_template_surats,id',
            'karyawan_id' => 'required|exists:karyawans,id',
        ]);

        SuratKeluar::create([
            'template_id' => $request->template_id,
            'karyawan_id' => $request->karyawan_id,
            'status' => 'Draft',
            'created_by' => auth()->id(), 
        ]);

        return redirect()->route('keluar.index')->with('success', 'Draft surat berhasil dibuat.');
    }

    /**
     * Logika Inti: Terbitkan Surat & Generate Nomor Otomatis (Anti-Bentrok)
     */
    public function terbitkan($id)
    {
        $suratDraft = SuratKeluar::with('template')->findOrFail($id);

        if ($suratDraft->status !== 'Draft') {
            return back()->with('error', 'Surat ini sudah diterbitkan atau dibatalkan.');
        }

        try {
            DB::transaction(function () use ($suratDraft) {
                
                $tahunIni = date('Y');
                $bulanIniRomawi = $this->getBulanRomawi(date('n'));
                $kodeSurat = $suratDraft->template->kode_surat;

                // 1. PESSIMISTIC LOCKING
                $suratTerakhir = SuratKeluar::whereNotNull('nomor_surat')
                    ->whereYear('tanggal_terbit', $tahunIni)
                    ->lockForUpdate() 
                    ->latest('id')
                    ->first();

                // 2. Generate Nomor Urut
                if ($suratTerakhir) {
                    $nomorUrutTerakhir = (int) explode('/', $suratTerakhir->nomor_surat)[0];
                    $nomorBaru = $nomorUrutTerakhir + 1;
                } else {
                    $nomorBaru = 1;
                }

                // 3. Format Penomoran
                $formatNomor = sprintf("%03d/%s/LDP/%s/%s", $nomorBaru, $kodeSurat, $bulanIniRomawi, $tahunIni);

                // 4. Simpan ke database
                $suratDraft->update([
                    'nomor_surat' => $formatNomor,
                    'status' => 'Terbit',
                    'tanggal_terbit' => now()
                ]);
            });

            return back()->with('success', 'Surat berhasil diterbitkan dengan nomor resmi.');

        } catch (\Exception $e) {
            return back()->with('error', 'Gagal menerbitkan surat: ' . $e->getMessage());
        }
    }

    private function getBulanRomawi($bulan)
    {
        $map = [
            1 => 'I', 2 => 'II', 3 => 'III', 4 => 'IV', 5 => 'V', 6 => 'VI',
            7 => 'VII', 8 => 'VIII', 9 => 'IX', 10 => 'X', 11 => 'XI', 12 => 'XII'
        ];
        return $map[$bulan];
    }
}