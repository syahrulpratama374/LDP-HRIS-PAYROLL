<?php

namespace App\Http\Controllers\Persuratan;

use App\Http\Controllers\Controller;
use App\Models\SuratKeluar;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;

class SuratKeluarController extends Controller
{
    public function index()
    {
        $suratKeluars = SuratKeluar::with(['template', 'karyawan', 'pembuat'])
            ->latest()
            ->paginate(10);

        return Inertia::render('Persuratan/Keluar/Index', [
            'suratKeluars' => $suratKeluars
        ]);
    }

    public function create()
    {
        $templates = \App\Models\MasterTemplateSurat::where('is_active', true)->get();
        $karyawans = \App\Models\Karyawan::select('id', 'nama_lengkap', 'nik_internal')->where('status_aktif', true)->get();

        return Inertia::render('Persuratan/Keluar/Create', [
            'templates' => $templates,
            'karyawans' => $karyawans
        ]);
    }

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

    public function terbitkan($id)
    {
        $suratDraft = SuratKeluar::with('template')->findOrFail($id);

        if ($suratDraft->status !== 'Draft') {
            return back()->withErrors(['error' => 'Surat ini sudah diterbitkan atau dibatalkan.']);
        }

        try {
            DB::transaction(function () use ($suratDraft) {
                $tahunIni = date('Y');
                $bulanIniRomawi = $this->getBulanRomawi(date('n'));
                $kodeSurat = $suratDraft->template->kode_surat;

                // 1. PESSIMISTIC LOCKING: Kunci baris agar penomoran tidak bentrok
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

                // 3. Format Penomoran (001/SKK/LDP/IX/2026)
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
            return back()->withErrors(['error' => 'Gagal menerbitkan surat: ' . $e->getMessage()]);
        }
    }

    private function getBulanRomawi($bulan)
    {
        $map = [1 => 'I', 2 => 'II', 3 => 'III', 4 => 'IV', 5 => 'V', 6 => 'VI', 7 => 'VII', 8 => 'VIII', 9 => 'IX', 10 => 'X', 11 => 'XI', 12 => 'XII'];
        return $map[$bulan];
    }

    public function unduhPdf($id)
    {
        $surat = SuratKeluar::with(['template', 'karyawan.jabatan', 'karyawan.departemen'])->findOrFail($id);

        if ($surat->status !== 'Terbit') abort(403, 'Hanya surat yang sudah terbit yang bisa dicetak.');

        $konten = $surat->template->konten;

        // PARSER VARIABEL DINAMIS (Bisa ditambah sesuai kebutuhan HR)
        $variabel = [
            '[NOMOR_SURAT]' => $surat->nomor_surat,
            '[NAMA_KARYAWAN]' => $surat->karyawan->nama_lengkap,
            '[NIK]' => $surat->karyawan->nik_internal,
            '[JABATAN]' => $surat->karyawan->jabatan->nama_jabatan ?? '-',
            '[DEPARTEMEN]' => $surat->karyawan->departemen->nama_departemen ?? '-',
            '[TANGGAL]' => Carbon::parse($surat->tanggal_terbit)->translatedFormat('d F Y'),
        ];

        foreach ($variabel as $key => $value) {
            $konten = str_replace($key, $value, $konten);
        }

        $pdf = Pdf::loadView('pdf.surat', ['konten' => $konten]);
        $namaFile = $surat->template->kode_surat . '_' . str_replace('/', '_', $surat->nomor_surat) . '.pdf';

        return $pdf->download($namaFile);
    }
}