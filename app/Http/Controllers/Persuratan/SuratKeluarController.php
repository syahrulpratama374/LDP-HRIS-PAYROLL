<?php

namespace App\Http\Controllers\Persuratan;

use App\Http\Controllers\Controller;
use App\Models\SuratKeluar;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Barryvdh\DomPDF\Facade\Pdf;

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
        // UBAH BARIS INI:
        $karyawans = \App\Models\Karyawan::select('id', 'nama_lengkap', 'nik_internal')->get();

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

    /**
     * Generate dan Unduh File PDF Surat Resmi
     */
    public function unduhPdf($id)
    {
        $surat = SuratKeluar::with(['template', 'karyawan'])->findOrFail($id);

        if ($surat->status !== 'Terbit') {
            abort(403, 'Hanya surat yang sudah terbit yang bisa dicetak.');
        }

        // 1. Ambil format HTML dari database
        $konten = $surat->template->konten;

        // 2. Ganti kata kunci [NAMA_KARYAWAN] dan [NIK] dengan data asli
        $konten = str_replace('[NAMA_KARYAWAN]', $surat->karyawan->nama_lengkap, $konten);
        $konten = str_replace('[NIK]', $surat->karyawan->nik_internal, $konten);

        // 3. Render HTML tersebut menjadi file PDF
        $pdf = Pdf::loadView('pdf.surat', [
            'surat' => $surat,
            'konten' => $konten
        ]);

        // 4. Buat penamaan file otomatis (contoh: SKK_001_SKK_LDP_IX_2026.pdf)
        $namaFile = $surat->template->kode_surat . '_' . str_replace('/', '_', $surat->nomor_surat) . '.pdf';

        return $pdf->download($namaFile);
    }
}