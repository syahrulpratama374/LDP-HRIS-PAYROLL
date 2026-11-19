<?php

namespace App\Http\Controllers\Persuratan;

use App\Http\Controllers\Controller;
use App\Models\SuratKeluar;
use App\Models\ApprovalSuratKeluar;
use App\Models\UnitPenerbitSurat;
use App\Services\PenomoranSuratService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
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

        $userLogin = auth()->user()->load('karyawan');

        // --- TAMBAHAN BARU: Tempelkan status hak akses ke masing-masing surat ---
        $suratKeluars->getCollection()->transform(function ($surat) use ($userLogin) {
            $surat->can_approve = $this->checkCanApprove($surat, $userLogin);
            return $surat;
        });

        return Inertia::render('Persuratan/Keluar/Index', [
            'suratKeluars' => $suratKeluars,
            'auth' => [
                'user' => $userLogin,
            ]
        ]);
    }


    public function create()
    {
        // Template dengan rute berbasis role (mis. SPJ-PD) dibuat lewat modulnya sendiri
        $templates = \App\Models\MasterTemplateSurat::with('ruteApprovals.jabatan')
            ->where('is_active', true)
            ->tanpaRuteRole()
            ->get();
        
        $karyawans = \App\Models\Karyawan::with('jabatan')
            ->where('status_aktif', true)
            ->get();
        
        return Inertia::render('Persuratan/Keluar/Create', [
            'templates' => $templates,
            'karyawans' => $karyawans,
            'unitPenerbits' => $this->daftarUnitPenerbit(),
            // Kosong bila departemen pembuat belum punya unit (atau Admin tanpa karyawan): wajib dipilih manual
            'defaultUnitPenerbitId' => UnitPenerbitSurat::defaultUntukUser(auth()->user())?->id,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'template_id'     => 'required|exists:master_template_surats,id',
            'unit_penerbit_id' => $this->aturanUnitPenerbit(),
            'karyawan_id'     => 'nullable|exists:karyawans,id',
            'isi_surat_final' => 'required|string',
            'lampirans.*'     => 'nullable|file|mimes:pdf,jpg,jpeg,png,docx|max:5120',
        ]);

        $template = \App\Models\MasterTemplateSurat::with('ruteApprovals')->findOrFail($request->template_id);
        if ($template->ruteApprovals->contains(fn ($r) => $r->berbasisRole())) {
            return redirect()->back()->withInput()->withErrors([
                'template_id' => "Jenis surat {$template->kode_surat} memakai rute berbasis role dan dibuat lewat modulnya sendiri (mis. SPJ Perjalanan Dinas), bukan lewat Surat Keluar.",
            ]);
        }

        $surat = new SuratKeluar();
        $surat->template_id     = $template->id;
        $surat->unit_penerbit_id = $request->unit_penerbit_id;
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
        $surat = SuratKeluar::with(['template', 'lampirans', 'pembuat.karyawan'])->findOrFail($id);
        $this->tolakBilaSudahTerbit($surat);

        $templates = \App\Models\MasterTemplateSurat::where('is_active', true)->get();
        $karyawans = \App\Models\Karyawan::where('status_aktif', true)->get();

        return Inertia::render('Persuratan/Keluar/Edit', [
            'surat'     => $surat,
            'templates' => $templates,
            'karyawans' => $karyawans,
            'unitPenerbits' => $this->daftarUnitPenerbit(),
            // Draf lama tanpa penerbit: usulkan unit departemen pembuat (bila ada)
            'defaultUnitPenerbitId' => $surat->unit_penerbit_id
                ?? UnitPenerbitSurat::defaultUntukUser($surat->pembuat)?->id,
        ]);
    }

    public function update(Request $request, $id)
    {
        $surat = SuratKeluar::findOrFail($id);
        $this->tolakBilaSudahTerbit($surat);

        $request->validate([
            'unit_penerbit_id' => $this->aturanUnitPenerbit(),
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
            'unit_penerbit_id' => $request->unit_penerbit_id,
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
        $this->tolakBilaSudahTerbit($surat, 'Surat yang sudah terbit tidak dapat dihapus.');

        $surat->delete();

        return redirect()->route('keluar.index')->with('success', 'Draf surat berhasil dihapus.');
    }

    public function approve(Request $request, $id)
    {
        $surat = SuratKeluar::with(['template'])->findOrFail($id);
        $user = auth()->user();

        // 1. CARI ANTREAN AKTIF
        $approvalAktif = ApprovalSuratKeluar::where('surat_keluar_id', $surat->id)
            ->where('status', 'Menunggu')
            ->orderBy('urutan_langkah', 'asc')
            ->first();

        if (!$approvalAktif) {
            return redirect()->back()->with('error', 'Tidak ada antrean persetujuan aktif untuk surat ini.');
        }

        // 2. OTORISASI (helper yang sama dengan can_approve di daftar surat)
        $wewenang = $this->wewenangApproval($surat, $user, $approvalAktif);
        abort_unless($wewenang['boleh'], 403, $wewenang['pesan']);
        $keteranganApproval = $wewenang['pesan'];

        // --- (BAGIAN OLAH GAMBAR TTD DAN DATABASE TRANSACTION SAMA PERSIS SEPERTI SEBELUMNYA) ---
        
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
        if ($jenisTtd === 'upload_gambar' && $request->hasFile('ttd_file')) {
            $file = $request->file('ttd_file');
            $fileName = 'ttd_approval_upload_' . $approvalAktif->id . '_' . time() . '.' . $file->getClientOriginalExtension();
            // Simpan langsung menggunakan path yang sama persis dengan canvas agar tidak error
            $ttdImagePath = $file->storeAs('persuratan/ttd', $fileName, 'public');
        }

        try {
            // Retry 3x bila MySQL mendeteksi deadlock/lock timeout saat dua persetujuan bersamaan
            $nomorResmi = DB::transaction(function () use ($surat, $approvalAktif, $user, $request, $keteranganApproval, $jenisTtd, $ttdImagePath) {
                // Kunci surat & antrean aktif lalu cek ulang: cegah klik ganda / dua approver bersamaan
                $surat = SuratKeluar::with(['template', 'unitPenerbit', 'pembuat'])->lockForUpdate()->findOrFail($surat->id);
                if ($surat->status === 'Terbit') {
                    throw new \DomainException('Surat ini sudah terbit dengan nomor ' . $surat->nomor_surat . '.');
                }

                $antrean = ApprovalSuratKeluar::where('surat_keluar_id', $surat->id)
                    ->where('status', 'Menunggu')
                    ->orderBy('urutan_langkah', 'asc')
                    ->lockForUpdate()
                    ->first();
                if (!$antrean || $antrean->id !== $approvalAktif->id) {
                    throw new \DomainException('Tahap persetujuan ini sudah diproses. Muat ulang halaman.');
                }

                $antrean->update([
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

                if ($sisaMenunggu > 0) {
                    \App\Models\RiwayatSuratApproval::create([
                        'surat_keluar_id' => $surat->id,
                        'user_id'         => $user->id,
                        'aksi'            => 'Disetujui Parsial',
                        'catatan'         => $keteranganApproval,
                    ]);

                    return null;
                }

                // Persetujuan terakhir: terbitkan nomor resmi (bulan & tahun = waktu terbit)
                $waktuTerbit = now();
                $kodePenerbit = $this->kodePenerbitSaatTerbit($surat);
                $kodeJenis = ($surat->template && !empty($surat->template->kode_surat)) ? $surat->template->kode_surat : 'UMUM';
                $nomor = app(PenomoranSuratService::class)->terbitkan($kodeJenis, $kodePenerbit, $waktuTerbit, $surat);

                $surat->update([
                    'nomor_surat'     => $nomor,
                    'status'          => 'Terbit',
                    'status_approval' => 'Disetujui',
                    'tanggal_terbit'  => $waktuTerbit,
                    'qr_code_token'   => (string) Str::uuid(),
                ]);

                \App\Models\RiwayatSuratApproval::create([
                    'surat_keluar_id' => $surat->id,
                    'user_id'         => $user->id,
                    'aksi'            => 'Terbit',
                    'catatan'         => 'Surat disetujui penuh dan resmi diterbitkan.',
                ]);

                return $nomor;
            }, 3);
        } catch (\DomainException $e) {
            return redirect()->back()->with('error', $e->getMessage());
        } catch (\Throwable $e) {
            report($e);
            return redirect()->back()->with('error', 'Terjadi kesalahan sistem saat menerbitkan surat: ' . $e->getMessage());
        }

        return $nomorResmi
            ? redirect()->back()->with('success', 'Surat selesai disetujui! Nomor Resmi: ' . $nomorResmi)
            : redirect()->back()->with('success', 'Persetujuan disimpan. Diteruskan ke tahap berikutnya.');
    }

    /**
     * Kode penerbit saat surat terbit. Surat baru selalu punya unit_penerbit_id; fallback di bawah
     * hanya untuk draf lama: unit departemen pembuat, lalu LDP-CORP. Keduanya dicatat di log.
     */
    private function kodePenerbitSaatTerbit(SuratKeluar $surat): string
    {
        if ($surat->unitPenerbit) {
            return $surat->unitPenerbit->kode;
        }

        $unit = UnitPenerbitSurat::defaultUntukUser($surat->pembuat);
        if ($unit) {
            Log::info("Penomoran surat: draf lama #{$surat->id} tanpa penerbit, memakai unit departemen pembuat {$unit->kode}.");
        } else {
            $unit = UnitPenerbitSurat::where('kode', PenomoranSuratService::PENERBIT_FALLBACK)->first();
            Log::warning("Penomoran surat: draf lama #{$surat->id} tanpa penerbit dan departemen pembuat tanpa unit, memakai fallback " . PenomoranSuratService::PENERBIT_FALLBACK . '.');
        }

        if ($unit) {
            $surat->unit_penerbit_id = $unit->id;
        }

        return $unit->kode ?? PenomoranSuratService::PENERBIT_FALLBACK;
    }

    /** Surat yang sudah terbit tidak boleh diedit, dihapus, atau diganti nomor/penerbitnya. */
    private function tolakBilaSudahTerbit(SuratKeluar $surat, string $pesan = 'Surat yang sudah terbit tidak dapat diubah.'): void
    {
        abort_if($surat->status === 'Terbit' || !empty($surat->nomor_surat), 403, $pesan);
    }

    private function daftarUnitPenerbit()
    {
        return UnitPenerbitSurat::aktif()->orderBy('kode')->get(['id', 'kode', 'nama', 'departemen_id']);
    }

    private function aturanUnitPenerbit(): array
    {
        return ['required', Rule::exists('unit_penerbit_surats', 'id')->where('is_active', true)];
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
        $surat = SuratKeluar::with(['template', 'karyawan.jabatan', 'approvals.jabatan', 'approvals.userAktual.karyawan.jabatan'])
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

    /** Dipakai daftar surat untuk menampilkan tombol Setujui. */
    private function checkCanApprove($surat, $user)
    {
        if (!$user) return false;

        $approvalAktif = ApprovalSuratKeluar::where('surat_keluar_id', $surat->id)
            ->where('status', 'Menunggu')
            ->orderBy('urutan_langkah', 'asc')
            ->first();

        return $this->wewenangApproval($surat, $user, $approvalAktif)['boleh'];
    }

    /**
     * Satu-satunya aturan otorisasi persetujuan Surat Keluar (tampilan & proses):
     * - Admin (role 1) dan user tanpa data karyawan tidak boleh menandatangani.
     * - Pembuat tidak boleh menyetujui suratnya sendiri.
     * - Approver harus menjabat jabatan langkah aktif. Direksi (kode jabatan CEO/MD) boleh lintas
     *   departemen; jenjang lain wajib satu departemen dengan pembuat surat.
     * - Delegasi berstatus 'Aktif' dengan hari ini di rentang tgl_mulai–tgl_selesai: penerima mewarisi
     *   jabatan pemberi, dengan aturan departemen yang sama (berdasarkan pemberi).
     *
     * @return array{boleh: bool, pesan: string}
     */
    private function wewenangApproval(SuratKeluar $surat, \App\Models\User $user, ?ApprovalSuratKeluar $langkah): array
    {
        $tolak = fn (string $pesan) => ['boleh' => false, 'pesan' => $pesan];

        if (!$langkah) {
            return $tolak('Tidak ada antrean persetujuan aktif untuk surat ini.');
        }
        if ($user->role_id === 1) {
            return $tolak('Admin tidak dapat menyetujui atau menandatangani Surat Keluar.');
        }
        if ((int) $surat->created_by === (int) $user->id) {
            return $tolak('Pembuat surat tidak dapat menyetujui suratnya sendiri.');
        }

        $karyawanLogin = \App\Models\Karyawan::with('jabatan')->where('user_id', $user->id)->first();
        if (!$karyawanLogin) {
            return $tolak('Akun Anda tidak terhubung dengan data karyawan.');
        }

        $departemenPembuat = \App\Models\Karyawan::where('user_id', $surat->created_by)->value('departemen_id');
        $berwenang = fn (\App\Models\Karyawan $pejabat) => $pejabat->jabatan_id === $langkah->jabatan_id
            && ($this->isDireksi($pejabat) || ($departemenPembuat && $pejabat->departemen_id === $departemenPembuat));

        if ($berwenang($karyawanLogin)) {
            return ['boleh' => true, 'pesan' => $this->isDireksi($karyawanLogin)
                ? 'Disetujui oleh Jajaran Direksi.'
                : 'Disetujui oleh pejabat berwenang di departemen.'];
        }

        $today = now()->toDateString();
        $delegasis = \App\Models\DelegasiWewenang::with('pemberi.jabatan')
            ->where('penerima_id', $karyawanLogin->id)
            ->where('status', 'Aktif')
            ->whereDate('tgl_mulai', '<=', $today)
            ->whereDate('tgl_selesai', '>=', $today)
            ->get();

        foreach ($delegasis as $delegasi) {
            if ($delegasi->pemberi && $berwenang($delegasi->pemberi)) {
                return ['boleh' => true, 'pesan' => "Disetujui oleh Plt. atas nama {$delegasi->pemberi->nama_lengkap}."];
            }
        }

        return $tolak('Anda tidak memiliki wewenang untuk menyetujui tahap ini.');
    }

    /** Direksi ditentukan dari kode jabatan, bukan kata di nama jabatan. */
    private function isDireksi(\App\Models\Karyawan $karyawan): bool
    {
        return in_array(strtoupper((string) $karyawan->jabatan?->kode_jabatan), ['CEO', 'MD'], true);
    }
}
