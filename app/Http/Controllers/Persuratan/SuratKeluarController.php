<?php

namespace App\Http\Controllers\Persuratan;

use App\Http\Controllers\Controller;
use App\Models\SuratKeluar;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;
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
        // Ambil template yang aktif
        $templates = \App\Models\MasterTemplateSurat::where('is_active', true)->get();
        
        // Ambil semua karyawan untuk opsi tujuan surat
        $karyawans = \App\Models\Karyawan::with('jabatan')->where('status_aktif', true)->get();
        
        // Ambil daftar Direksi/Pimpinan yang punya hak TTD (Misal dari role atau jabatan tertentu)
        // Sesuaikan query ini dengan struktur Role/Jabatan Direktur di LDP
    $approvers = \App\Models\User::whereIn('role_id', [1, 2])->get();

        return inertia('Persuratan/Keluar/Create', [
            'templates' => $templates,
            'karyawans' => $karyawans,
            'approvers' => $approvers,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'template_id' => 'required|exists:master_template_surats,id',
            'karyawan_id' => 'required|exists:karyawans,id',
            // approver_id wajib jika template butuh approval
            'approver_id' => 'nullable|exists:users,id',
        ]);

        $template = \App\Models\MasterTemplateSurat::findOrFail($request->template_id);

        $surat = new \App\Models\SuratKeluar();
        $surat->template_id = $template->id;
        $surat->karyawan_id = $request->karyawan_id;
        $surat->created_by = auth()->user()->id;
        
        // Tentukan status dan alur berdasarkan jenis template
        if ($template->kategori_alur === 'Approval_Direksi') {
            $surat->approver_id = $request->approver_id;
            $surat->status = 'Draft';
            $surat->status_approval = 'Menunggu_Approval';
        } else {
            // Jika hanya notifikasi, langsung generate nomor dan terbitkan
            $surat->status = 'Terbit';
            $surat->status_approval = 'Disetujui';
            $surat->jenis_ttd = 'Tanpa_TTD';
            $surat->tanggal_terbit = now();
            $surat->nomor_surat = $this->generateNomorSurat($template);
        }

        $surat->save();

        // Catat riwayat jika masuk alur approval
        if ($template->kategori_alur === 'Approval_Direksi') {
            \App\Models\RiwayatSuratApproval::create([
                'surat_keluar_id' => $surat->id,
                'user_id' => auth()->user()->id,
                'aksi' => 'Diajukan',
                'catatan' => 'Draft surat diajukan untuk persetujuan.',
            ]);
            
            return redirect()->route('keluar.index')->with('success', 'Draft surat berhasil diajukan dan menunggu persetujuan pimpinan.');
        }

        return redirect()->route('keluar.index')->with('success', 'Surat (Tembusan) berhasil diterbitkan secara otomatis.');
    }


    public function terbitkan(Request $request, $id)
    {
        $surat = \App\Models\SuratKeluar::with('template')->findOrFail($id);

        // Pastikan hanya Approver yang ditunjuk yang bisa menyetujui (opsional, untuk keamanan)
        if (auth()->user()->id !== $surat->approver_id && auth()->user()->role_id !== 1) {
            abort(403, 'Anda tidak berhak menyetujui surat ini.');
        }

        $request->validate([
            'jenis_ttd' => 'required|in:Digital_Canvas,Qr_Code_Quick',
            'signature_base64' => 'required_if:jenis_ttd,Digital_Canvas', // Wajib ada coretan jika pilih Canvas
        ]);

        // Proses Tanda Tangan Digital (Canvas)
        if ($request->jenis_ttd === 'Digital_Canvas') {
            $image_parts = explode(";base64,", $request->signature_base64);
            $image_base64 = base64_decode($image_parts[1]);
            
            $fileName = 'ttd_' . $surat->id . '_' . time() . '.png';
            $filePath = 'persuratan/ttd/' . $fileName;
            
            Storage::disk('public')->put($filePath, $image_base64);
            $surat->file_ttd_path = $filePath;
        } 
        // Proses QR Code Validasi
        else {
            $surat->qr_code_token = (string) Str::uuid(); // Generate token unik
        }

        // Generate Nomor Surat (karena sekarang resmi terbit)
        $surat->nomor_surat = $this->generateNomorSurat($surat->template);
        $surat->status = 'Terbit';
        $surat->status_approval = 'Disetujui';
        $surat->jenis_ttd = $request->jenis_ttd;
        $surat->tanggal_terbit = now();
        $surat->save();

        // Catat di Riwayat Approval
        \App\Models\RiwayatSuratApproval::create([
            'surat_keluar_id' => $surat->id,
            'user_id' => auth()->user()->id,
            'aksi' => 'Disetujui',
            'catatan' => 'Surat telah disetujui dan diterbitkan.',
        ]);

        return redirect()->back()->with('success', 'Surat berhasil disetujui dan diterbitkan dengan Nomor: ' . $surat->nomor_surat);
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
    /**
     * Fungsi Helper untuk Generate Nomor Surat Otomatis ala LDP
     */
    private function generateNomorSurat($template)
    {
        $tahun = date('Y');
        $bulanAngka = date('n');
        
        // Konversi bulan ke Romawi
        $mapRomawi = [
            1 => 'I', 2 => 'II', 3 => 'III', 4 => 'IV', 5 => 'V', 6 => 'VI',
            7 => 'VII', 8 => 'VIII', 9 => 'IX', 10 => 'X', 11 => 'XI', 12 => 'XII'
        ];
        $bulanRomawi = $mapRomawi[$bulanAngka];

        // Cari nomor urut terakhir di tahun ini untuk template terkait
        $suratTerakhir = \App\Models\SuratKeluar::where('template_id', $template->id)
            ->whereYear('created_at', $tahun)
            ->whereNotNull('nomor_surat')
            ->orderBy('id', 'desc')
            ->first();

        $nomorUrut = 1;
        if ($suratTerakhir && $suratTerakhir->nomor_surat) {
            // Asumsi format: 001/SK/LDP-DIR/IX/2026, kita pecah / explode
            $pecahan = explode('/', $suratTerakhir->nomor_surat);
            if (is_numeric($pecahan[0])) {
                $nomorUrut = (int)$pecahan[0] + 1;
            }
        }

        // Format jadi 3 digit (contoh: 001, 015, 120)
        $nomorUrutFormatted = str_pad($nomorUrut, 3, '0', STR_PAD_LEFT);

        // Susun nomor akhir
        $kodeSurat = $template->kode_surat; // Contoh: SKEP
        $kodePembuat = $template->pembuat_kode; // Contoh: LDP-HC

        return "{$nomorUrutFormatted}/{$kodeSurat}/{$kodePembuat}/{$bulanRomawi}/{$tahun}";
    }
}