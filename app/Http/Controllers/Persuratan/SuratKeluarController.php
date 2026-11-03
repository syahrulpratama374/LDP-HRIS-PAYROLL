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
use Illuminate\Support\Facades\DB;

class SuratKeluarController extends Controller
{
    public function index()
    {
        $suratKeluars = SuratKeluar::with([
            'template', 
            'karyawan', 
            'pembuat', 
            'lampirans',
            'approvals.jabatan', 
            'approvals.userAktual'
        ])
        ->latest()
        ->paginate(10);

        // Ambil data karyawan dari user yang sedang login
        $userLogin = auth()->user()->load('karyawan');

        return Inertia::render('Persuratan/Keluar/Index', [
            'suratKeluars' => $suratKeluars,
            'auth' => [
                'user' => $userLogin,
            ]
        ]);
    }

    public function create()
    {
        $templates = \App\Models\MasterTemplateSurat::with('ruteApprovals.jabatan')
            ->where('is_active', true)
            ->get();
        
        $karyawans = \App\Models\Karyawan::with('jabatan')
            ->where('status_aktif', true)
            ->get();
        
        return Inertia::render('Persuratan/Keluar/Create', [
            'templates' => $templates,
            'karyawans' => $karyawans,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'template_id'     => 'required|exists:master_template_surats,id',
            'karyawan_id'     => 'nullable|exists:karyawans,id',
            'isi_surat_final' => 'required|string',
            'lampirans.*'     => 'nullable|file|mimes:pdf,jpg,jpeg,png,docx|max:5120',
        ]);

        $template = \App\Models\MasterTemplateSurat::with('ruteApprovals')->findOrFail($request->template_id);

        $surat = new SuratKeluar();
        $surat->template_id     = $template->id;
        $surat->karyawan_id     = $request->karyawan_id;
        $surat->created_by      = auth()->id();
        $surat->isi_surat_final = $request->isi_surat_final;
        $surat->nomor_surat     = null; // Nomor diterbitkan otomatis saat approval terakhir
        $surat->status          = 'Draft';
        $surat->status_approval = 'Menunggu_Approval';
        $surat->save();

        // Generasi Rute Persetujuan berdasarkan Master Template
        if ($template->ruteApprovals && $template->ruteApprovals->count() > 0) {
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
            // Default ke Direktur Utama jika rute belum dikonfigurasi di template
            $jabatanDirekturId = \App\Models\Jabatan::where('nama_jabatan', 'LIKE', '%Direktur%')->value('id') ?? 1;

            ApprovalSuratKeluar::create([
                'surat_keluar_id' => $surat->id,
                'urutan_langkah'  => 1,
                'jabatan_id'      => $jabatanDirekturId,
                'label_ttd'       => 'Menyetujui, Direktur Utama',
                'status'          => 'Menunggu',
            ]);
        }

        // Upload Lampiran Berkas
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

    public function edit($id)
    {
        $surat = SuratKeluar::with(['template', 'lampirans'])->findOrFail($id);

        if ($surat->status === 'Terbit') {
            return redirect()->back()->with('error', 'Surat yang sudah terbit tidak dapat diubah.');
        }

        $templates = \App\Models\MasterTemplateSurat::where('is_active', true)->get();
        $karyawans = \App\Models\Karyawan::where('status_aktif', true)->get();

        return Inertia::render('Persuratan/Keluar/Edit', [
            'surat'     => $surat,
            'templates' => $templates,
            'karyawans' => $karyawans,
        ]);
    }

    public function update(Request $request, $id)
    {
        $surat = SuratKeluar::findOrFail($id);

        if ($surat->status === 'Terbit') {
            return redirect()->back()->with('error', 'Surat yang sudah terbit tidak dapat diubah.');
        }

        $request->validate([
            'karyawan_id'     => 'nullable|exists:karyawans,id',
            'isi_surat_final' => 'required|string',
        ]);

        $statusApprovalBaru = ($surat->status_approval === 'Ditolak') ? 'Menunggu_Approval' : $surat->status_approval;

        if ($surat->status_approval === 'Ditolak') {
            // Reset status semua tahap approval ke 'Menunggu' & bersihkan TTD lama
            ApprovalSuratKeluar::where('surat_keluar_id', $surat->id)->update([
                'status'         => 'Menunggu',
                'user_id_aktual' => null,
                'waktu_approval' => null,
                'catatan'        => null,
                'jenis_ttd'      => null,
                'ttd_image_path' => null,
            ]);
        }

        $surat->update([
            'karyawan_id'     => $request->karyawan_id,
            'isi_surat_final' => $request->isi_surat_final,
            'status_approval' => $statusApprovalBaru,
            'catatan_revisi'  => null,
        ]);

        return redirect()->route('keluar.index')->with('success', 'Perbaikan draf surat berhasil disimpan dan diajukan ulang.');
    }

    public function destroy($id)
    {
        $surat = SuratKeluar::findOrFail($id);

        if ($surat->status === 'Terbit') {
            return redirect()->back()->with('error', 'Surat yang sudah terbit tidak dapat dihapus.');
        }

        $surat->delete();

        return redirect()->route('keluar.index')->with('success', 'Draf surat berhasil dihapus.');
    }
    

    public function approve(Request $request, $id)
    {
        $surat = SuratKeluar::with(['template', 'karyawan'])->findOrFail($id);
        $user = auth()->user();
        $karyawanLogin = \App\Models\Karyawan::where('user_id', $user->id)->first();

        // 1. CARI ANTREAN
        $approvalAktif = ApprovalSuratKeluar::where('surat_keluar_id', $surat->id)
            ->where('status', 'Menunggu')
            ->orderBy('urutan_langkah', 'asc')
            ->first();

        if (!$approvalAktif) {
            return redirect()->back()->with('error', 'Tidak ada antrean persetujuan aktif untuk surat ini.');
        }

        // 2. CEK WEWENANG
        $isAuthorized = false;
        $keteranganApproval = '';

        if ($karyawanLogin && $karyawanLogin->jabatan_id === $approvalAktif->jabatan_id) {
            $isAuthorized = true;
            $keteranganApproval = 'Disetujui oleh pejabat bersangkutan.';
        } else if ($karyawanLogin) {
            $today = now()->toDateString();
            $delegasi = \App\Models\DelegasiWewenang::where('penerima_id', $karyawanLogin->id)
                ->where('status', 'Disetujui')
                ->where('tgl_mulai', '<=', $today)
                ->where('tgl_selesai', '>=', $today)
                ->whereHas('pemberi', function($q) use ($approvalAktif) {
                    $q->where('jabatan_id', $approvalAktif->jabatan_id);
                })
                ->first();

            if ($delegasi) {
                $isAuthorized = true;
                $keteranganApproval = "Disetujui oleh Plt. atas nama {$delegasi->pemberi->nama_lengkap}.";
            }
        }

        if ($user->role_id === 1) {
            $isAuthorized = true;
            $keteranganApproval = 'Disetujui langsung oleh Super Admin.';
        }

        if (!$isAuthorized) {
            return redirect()->back()->with('error', 'Anda tidak memiliki hak wewenang untuk menyetujui tahap ini.');
        }

        // 3. OLAH GAMBAR TTD
        $jenisTtd = $request->input('jenis_ttd') ?? 'qr_code';
        $ttdBase64 = $request->input('ttd_base64');
        $ttdImagePath = null;

        if ($jenisTtd === 'canvas' && !empty($ttdBase64)) {
            $imageParts = explode(";base64,", $ttdBase64);
            $imageBase64String = isset($imageParts[1]) ? $imageParts[1] : $ttdBase64;
            $imageBase64 = base64_decode($imageBase64String);
            if ($imageBase64) {
                $fileName = 'ttd_approval_' . $approvalAktif->id . '_' . time() . '.png';
                $ttdImagePath = 'persuratan/ttd/' . $fileName;
                Storage::disk('public')->put($ttdImagePath, $imageBase64);
            }
        }

        // 4. GUNAKAN DATABASE TRANSACTION UNTUK MENCEGAH DATA TERTAHAN JIKA ERROR
        try {
            DB::beginTransaction();

            $approvalAktif->update([
                'status'         => 'Disetujui',
                'user_id_aktual' => $user->id,
                'waktu_approval' => now(),
                'catatan'        => $request->input('catatan') ?? $keteranganApproval,
                'jenis_ttd'      => $jenisTtd,
                'ttd_image_path' => $ttdImagePath,
            ]);

            $sisaMenunggu = ApprovalSuratKeluar::where('surat_keluar_id', $surat->id)
                ->where('status', 'Menunggu')
                ->count();

            if ($sisaMenunggu === 0) {
                $nomorResmi = $this->generateNomorSurat($surat);

                $surat->update([
                    'nomor_surat'     => $nomorResmi,
                    'status'          => 'Terbit',
                    'status_approval' => 'Disetujui',
                    'tanggal_terbit'  => now(),
                    'qr_code_token'   => (string) Str::uuid(),
                ]);

                \App\Models\RiwayatSuratApproval::create([
                    'surat_keluar_id' => $surat->id,
                    'user_id'         => $user->id,
                    'aksi'            => 'Terbit',
                    'catatan'         => 'Surat disetujui penuh dan resmi diterbitkan.',
                ]);

                DB::commit(); // Simpan permanen ke DB jika semua sukses
                return redirect()->back()->with('success', 'Surat selesai disetujui! Nomor Resmi: ' . $nomorResmi);
            }

            \App\Models\RiwayatSuratApproval::create([
                'surat_keluar_id' => $surat->id,
                'user_id'         => $user->id,
                'aksi'            => 'Disetujui Parsial',
                'catatan'         => $keteranganApproval,
            ]);

            DB::commit();
            return redirect()->back()->with('success', 'Persetujuan disimpan. Diteruskan ke tahap berikutnya.');

        } catch (\Exception $e) {
            DB::rollBack(); // Batalkan semua proses jika ada error agar data tidak setengah matang
            return redirect()->back()->with('error', 'Terjadi kesalahan sistem saat menerbitkan surat: ' . $e->getMessage());
        }
    }

    private function generateNomorSurat($surat)
    {
        $tahun = date('Y');
        $bulanAngka = date('n');

        $mapRomawi = [
            1 => 'I', 2 => 'II', 3 => 'III', 4 => 'IV', 5 => 'V', 6 => 'VI',
            7 => 'VII', 8 => 'VIII', 9 => 'IX', 10 => 'X', 11 => 'XI', 12 => 'XII'
        ];
        $bulanRomawi = $mapRomawi[$bulanAngka] ?? 'XI';

        // ALGORITMA BARU: Mengambil nomor tertinggi secara absolut tanpa mempedulikan urutan ID
        $suratTahunIni = \App\Models\SuratKeluar::whereYear('tanggal_terbit', $tahun)
            ->whereNotNull('nomor_surat')
            ->get();

        $maxNomor = 0;
        foreach ($suratTahunIni as $s) {
            $pecahan = explode('/', $s->nomor_surat);
            if (isset($pecahan[0]) && is_numeric($pecahan[0])) {
                $nom = (int)$pecahan[0];
                if ($nom > $maxNomor) {
                    $maxNomor = $nom;
                }
            }
        }

        $nomorUrut = $maxNomor + 1;
        $nomorUrutFormatted = str_pad($nomorUrut, 3, '0', STR_PAD_LEFT);

        $template = $surat->template;
        $kodeSurat   = ($template && !empty($template->kode_surat)) ? $template->kode_surat : '1010';
        $kodePembuat = ($template && !empty($template->pembuat_kode)) ? $template->pembuat_kode : 'ldp';

        return "{$nomorUrutFormatted}/{$kodeSurat}/{$kodePembuat}/{$bulanRomawi}/{$tahun}";
    }

    public function verifikasi($uuid)
    {
        $surat = SuratKeluar::with(['template', 'karyawan.jabatan', 'approvals.jabatan', 'approvals.userAktual'])
            ->where('qr_code_token', $uuid)
            ->orWhere('uuid', $uuid)
            ->firstOrFail();

        $layout = \App\Models\PengaturanSuratLayout::where('is_active', true)->first();

        return Inertia::render('Persuratan/Verifikasi', [
            'surat'  => $surat,
            'layout' => $layout,
        ]);
    }

    public function unduhPdf($id)
    {
        $surat = SuratKeluar::with(['template', 'karyawan.jabatan', 'approvals.jabatan', 'approvals.userAktual'])
            ->findOrFail($id);

        $layout = \App\Models\PengaturanSuratLayout::where('is_active', true)->first();

        $nomorAman = str_replace(['/', '\\'], '_', $surat->nomor_surat ?? $surat->id);
        $filename  = "Surat_{$nomorAman}.pdf";

        $pdf = Pdf::loadView('pdf.surat', [
            'surat'  => $surat,
            'layout' => $layout,
            'konten' => $surat->isi_surat_final ?? $surat->template->konten,
        ])->setPaper('a4', 'portrait');

        return $pdf->stream($filename);
    }
}