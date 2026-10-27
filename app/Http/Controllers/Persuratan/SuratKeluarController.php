<?php

namespace App\Http\Controllers\Persuratan;

use App\Http\Controllers\Controller;
use App\Models\SuratKeluar;
use App\Models\ApprovalSuratKeluar;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;

class SuratKeluarController extends Controller
{
    public function index()
    {
        $suratKeluars = SuratKeluar::with(['template', 'karyawan', 'approvals.jabatan', 'approvals.userAktual'])
            ->latest()
            ->paginate(10);

        return Inertia::render('Persuratan/Keluar/Index', [
            'suratKeluars' => $suratKeluars
        ]);
    }

    public function create()
    {
        $templates = \App\Models\MasterTemplateSurat::with('ruteApprovals.jabatan')
            ->where('is_active', true)->get();
        
        $karyawans = \App\Models\Karyawan::with('jabatan')
            ->where('status_aktif', true)->get();
        
        // KITA HAPUS $approvers, karena rute sekarang ditentukan OTOMATIS dari blueprint Admin.
        
        return inertia('Persuratan/Keluar/Create', [
            'templates' => $templates,
            'karyawans' => $karyawans,
        ]);
    }

    // 1. FUNGSI SIMPAN DRAF & COPY RUTE BLUEPRINT
    public function store(Request $request)
    {
        $request->validate([
            'template_id'     => 'required|exists:master_template_surats,id',
            'karyawan_id'     => 'required|exists:karyawans,id',
            'isi_surat_final' => 'required|string',
            'lampirans.*'     => 'nullable|file|mimes:pdf,jpg,jpeg,png,docx|max:5120',
        ]);

        $template = \App\Models\MasterTemplateSurat::with('ruteApprovals')->findOrFail($request->template_id);

        $surat = new SuratKeluar();
        $surat->template_id     = $template->id;
        $surat->karyawan_id     = $request->karyawan_id;
        $surat->created_by      = auth()->user()->id;
        $surat->isi_surat_final = $request->isi_surat_final;
        $surat->nomor_surat     = null; // Lazy Numbering (Dikosongkan dulu)
        $surat->status          = 'Draft';
        $surat->status_approval = 'Menunggu_Approval';
        $surat->save();

        // COPY CETAK BIRU RUTE KE TRANSAKSI APPROVAL AKTUAL
        if ($template->ruteApprovals->count() > 0) {
            foreach ($template->ruteApprovals as $rute) {
                ApprovalSuratKeluar::create([
                    'surat_keluar_id' => $surat->id,
                    'urutan_langkah'  => $rute->urutan_langkah,
                    'jabatan_id'      => $rute->jabatan_id,
                    'label_ttd'       => $rute->label_ttd,
                    'status'          => 'Menunggu',
                ]);
            }
        } else {
            // Jika Admin tidak mengatur rute (Surat Langsung Terbit tanpa TTD)
            $surat->status = 'Terbit';
            $surat->status_approval = 'Disetujui';
            $surat->tanggal_terbit = now();
            $surat->nomor_surat = $this->generateNomorSurat($template);
            $surat->save();
        }

        // Simpan Lampiran File (Jika Ada)
        if ($request->hasFile('lampirans')) {
            foreach ($request->file('lampirans') as $file) {
                $path = $file->store('persuratan/lampiran', 'public');
                \App\Models\LampiranSuratKeluar::create([
                    'surat_keluar_id' => $surat->id,
                    'nama_file_asli'  => $file->getClientOriginalName(),
                    'file_path'       => $path,
                    'file_type'       => $file->getClientOriginalExtension(),
                    'file_size'       => round($file->getSize() / 1024),
                ]);
            }
        }

        return redirect()->route('keluar.index')->with('success', 'Draft surat berhasil diajukan dan masuk ke antrean persetujuan.');
    }

    // 2. FUNGSI MULTI-LEVEL APPROVAL (Oleh Para Manajer & Direktur)
    public function approve(Request $request, $id)
    {
        $surat = SuratKeluar::with(['template', 'approvals' => function($q) {
            $q->orderBy('urutan_langkah', 'asc');
        }])->findOrFail($id);

        $user = auth()->user();
        
        // Cari antrean approval yang SEDANG AKTIF (Menunggu) dan COCOK dengan Jabatan User saat ini
        $approvalAktif = $surat->approvals->where('status', 'Menunggu')->first();

        // Validasi Keamanan: Pastikan yang klik Approve adalah orang dengan jabatan yang tepat
        // (Asumsi di model User ada field jabatan_id, sesuaikan jika berbeda)
        if (!$approvalAktif || $user->jabatan_id !== $approvalAktif->jabatan_id) {
            abort(403, 'Belum giliran Anda, atau Anda tidak memiliki akses untuk menyetujui surat ini.');
        }

        // UPDATE STATUS APPROVAL ORANG TERSEBUT
        $approvalAktif->update([
            'status'         => 'Disetujui',
            'user_id_aktual' => $user->id,
            'waktu_approval' => now(),
        ]);

        // CEK APAKAH INI APPROVAL TERAKHIR?
        $sisaMenunggu = $surat->approvals->where('status', 'Menunggu')->count();

        if ($sisaMenunggu === 0) {
            // JIKA INI TTD TERAKHIR (Misal: Direktur), TERBITKAN SURAT & GENERATE NOMOR!
            $surat->nomor_surat     = $this->generateNomorSurat($surat->template);
            $surat->status          = 'Terbit';
            $surat->status_approval = 'Disetujui';
            $surat->tanggal_terbit  = now();
            
            // Generate QR Code Validasi Utama
            $surat->qr_code_token = (string) Str::uuid();
            $surat->save();

            \App\Models\RiwayatSuratApproval::create([
                'surat_keluar_id' => $surat->id,
                'user_id' => $user->id,
                'aksi' => 'Terbit',
                'catatan' => 'Surat selesai ditandatangani oleh semua pihak dan resmi diterbitkan.',
            ]);

            return redirect()->back()->with('success', 'Surat selesai disetujui penuh! Nomor Resmi: ' . $surat->nomor_surat);
        }

        // Jika MASIH ADA approval selanjutnya (Misal dari HC baru lanjut ke Finance)
        \App\Models\RiwayatSuratApproval::create([
            'surat_keluar_id' => $surat->id,
            'user_id' => $user->id,
            'aksi' => 'Disetujui Parsial',
            'catatan' => 'Surat disetujui oleh ' . $approvalAktif->label_ttd . '. Lanjut ke tahap berikutnya.',
        ]);

        return redirect()->back()->with('success', 'Tanda tangan berhasil. Diteruskan ke tahap persetujuan selanjutnya.');
    }

    private function generateNomorSurat($template)
    {
        $tahun = date('Y');
        $bulanAngka = date('n');
        
        $mapRomawi = [1 => 'I', 2 => 'II', 3 => 'III', 4 => 'IV', 5 => 'V', 6 => 'VI', 7 => 'VII', 8 => 'VIII', 9 => 'IX', 10 => 'X', 11 => 'XI', 12 => 'XII'];
        $bulanRomawi = $mapRomawi[$bulanAngka];

        $suratTerakhir = SuratKeluar::where('template_id', $template->id)
            ->whereYear('tanggal_terbit', $tahun) // Menggunakan tanggal terbit agar auto-reset awal tahun aman
            ->whereNotNull('nomor_surat')
            ->orderBy('id', 'desc')
            ->first();

        $nomorUrut = 1;
        if ($suratTerakhir && $suratTerakhir->nomor_surat) {
            $pecahan = explode('/', $suratTerakhir->nomor_surat);
            if (is_numeric($pecahan[0])) {
                $nomorUrut = (int)$pecahan[0] + 1;
            }
        }

        $nomorUrutFormatted = str_pad($nomorUrut, 3, '0', STR_PAD_LEFT);
        $kodeSurat = $template->kode_surat;
        $kodePembuat = $template->pembuat_kode;

        return "{$nomorUrutFormatted}/{$kodeSurat}/{$kodePembuat}/{$bulanRomawi}/{$tahun}";
    }
}