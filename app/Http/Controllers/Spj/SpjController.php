<?php

namespace App\Http\Controllers\Spj;

use App\Http\Controllers\Controller;
use App\Models\AuditTrail;
use App\Models\Karyawan;
use App\Models\MasterTarifSpj;
use App\Models\MasterTemplateSurat;
use App\Models\Spj;
use App\Models\SpjApproval;
use App\Models\UnitPenerbitSurat;
use App\Models\User;
use App\Services\Spj\OtorisasiApprovalSpj;
use App\Services\Spj\RekeningSpj;
use App\Services\Spj\SpjKalkulator;
use App\Services\Spj\SpjPdfService;
use App\Services\Spj\RekapSelisihSpjService;
use App\Services\Spj\ReimburseSpjService;
use App\Services\Spj\PembayaranSpjService;
use App\Models\SpjPembayaran;
use App\Models\SpjBiaya;
use App\Support\Terbilang;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

/**
 * SPJ Perjalanan Dinas model baru: pengajuan (draf -> ajukan) dan daftar.
 * Semua karyawan boleh membuat SPJ. Perhitungan selalu di server (SpjKalkulator).
 * PDF SPJ (B8a) dan halaman verifikasi QR publik ada di sini; nota, pembayaran, dan risalah menyusul.
 */
class SpjController extends Controller
{
    /** Batas lama perjalanan agar tanggal yang keliru tidak menghasilkan nominal tak wajar. */
    private const MAKS_HARI = 60;

    public function __construct(
        private SpjKalkulator $kalkulator,
        private OtorisasiApprovalSpj $otorisasi,
        private SpjPdfService $pdfService,
        private ReimburseSpjService $reimburse,
        private PembayaranSpjService $pembayaran,
    ) {}

    public function index(Request $request)
    {
        $user = $request->user();
        $cari = trim((string) $request->input('cari', ''));
        $status = $request->input('status');

        $idsMenunggu = $this->otorisasi->idsMenungguUser($user);

        $spjs = Spj::query()
            ->terlihatOleh($user, $idsMenunggu)
            ->with(['pembuat:id,name', 'unitPenerbit:id,kode'])
            ->withCount('pesertas')
            ->when($status, fn ($q) => $q->where('status', $status))
            ->when($cari !== '', fn ($q) => $q->where(fn ($w) => $w
                ->where('nomor_surat', 'like', "%{$cari}%")
                ->orWhere('provinsi', 'like', "%{$cari}%")
                ->orWhere('kota', 'like', "%{$cari}%")
                ->orWhere('keperluan', 'like', "%{$cari}%")))
            ->latest('id')
            ->paginate(15)
            ->withQueryString();

        $spjs->getCollection()->transform(fn (Spj $spj) => [
            'id' => $spj->id,
            'nomor_surat' => $spj->nomor_surat,
            'status' => $spj->status,
            'provinsi' => $spj->provinsi,
            'kota' => $spj->kota,
            'tgl_berangkat' => $spj->tgl_berangkat,
            'tgl_pulang' => $spj->tgl_pulang,
            'jumlah_hari' => $spj->jumlah_hari,
            'jumlah_peserta' => $spj->pesertas_count,
            'total_uang_harian' => (float) $spj->total_uang_harian,
            'pembuat' => $spj->pembuat?->name,
            'bisa_ubah' => $spj->bisaDiubahOleh($user),
            'menunggu_saya' => in_array($spj->id, $idsMenunggu, true),
        ]);

        return Inertia::render('PerjalananDinas/Index', [
            'spjs' => $spjs,
            'jumlahMenungguSaya' => count($idsMenunggu),
            'filter' => ['cari' => $cari, 'status' => $status],
            'statusList' => [Spj::STATUS_DRAFT, Spj::STATUS_DIAJUKAN, Spj::STATUS_DISETUJUI, Spj::STATUS_DITOLAK, Spj::STATUS_SELESAI, Spj::STATUS_DIBATALKAN],
        ]);
    }

    public function create(Request $request)
    {
        return Inertia::render('PerjalananDinas/Form', $this->dataForm($request->user()));
    }

    /** Detail SPJ: data, peserta (rekening sesuai peran), rincian, dan timeline persetujuan. */
    public function show(Request $request, Spj $spj)
    {
        $user = $request->user();
        abort_unless($this->bolehLihat($user, $spj), 403, 'Anda tidak berhak melihat SPJ ini.');

        $spj->load(['pesertas.pembayarans.pencatat:id,name', 'pesertas.pembayarans.pembatal:id,name', 'pesertas.biayas.pengunggah:id,name', 'pesertas.biayas.validator:id,name', 'pesertas.biayas.selisih',
            'pembuat:id,name', 'unitPenerbit:id,kode,nama',
            'approvals.role:id,nama_role', 'approvals.jabatan:id,nama_jabatan',
            'approvals.userAktual.karyawan:id,user_id,nama_lengkap', 'approvals.atasNama:id,nama_lengkap']);
        $langkahAktif = $spj->approvals->firstWhere('status', SpjApproval::MENUNGGU);
        $cek = $this->otorisasi->periksa($spj, $user, $langkahAktif);
        // TOTAL = uang harian + reimburse yang sudah divalidasi (sama dengan PDF)
        $totalAkomodasi = (float) $spj->pesertas->flatMap->biayas->where('status', SpjBiaya::DIVALIDASI)->sum('nominal_dibayar');
        $totalSemua = (float) $spj->total_uang_harian + $totalAkomodasi;

        return Inertia::render('PerjalananDinas/Show', [
            'spj' => [
                'id' => $spj->id,
                'nomor_surat' => $spj->nomor_surat,
                'status' => $spj->status,
                'provinsi' => $spj->provinsi,
                'kota' => $spj->kota,
                'tgl_berangkat' => $spj->tgl_berangkat,
                'tgl_pulang' => $spj->tgl_pulang,
                'jumlah_hari' => $spj->jumlah_hari,
                'jumlah_malam' => $spj->jumlah_malam,
                'keperluan' => $spj->keperluan,
                'tanggal_risalah_awal' => $spj->tanggal_risalah_awal,
                'unit_penerbit' => $spj->unitPenerbit ? "{$spj->unitPenerbit->kode} - {$spj->unitPenerbit->nama}" : null,
                'pembuat' => $spj->pembuat?->name,
                'diajukan_pada' => $spj->diajukan_pada?->toDateTimeString(),
                'tanggal_terbit' => $spj->tanggal_terbit?->toDateTimeString(),
                'catatan_revisi' => $spj->catatan_revisi,
                'total_uang_harian' => (float) $spj->total_uang_harian,
                'total_akomodasi' => $totalAkomodasi,
                'total' => $totalSemua,
                'terbilang' => Terbilang::rupiah($totalSemua),
            ],
            'pesertas' => $spj->pesertas->map(fn ($p) => [
                'karyawan_id' => $p->karyawan_id,
                'nama' => $p->nama,
                'posisi' => $p->posisi,
                'departemen' => $p->departemen,
                'kategori_tarif' => $p->kategori_tarif,
                'tarif_uang_harian' => $p->tarif_uang_harian === null ? null : (float) $p->tarif_uang_harian,
                'total_uang_harian' => (float) $p->total_uang_harian,
                'tarif_penginapan' => $p->tarif_penginapan === null ? null : (float) $p->tarif_penginapan,
                'batas_penginapan' => $p->batas_penginapan === null ? null : (float) $p->batas_penginapan,
                'rekening' => RekeningSpj::untuk($user, $p->rekening_encrypted, $p->karyawan_id),
                // Nota & reimburse (B6)
                'id' => $p->id,
                'bisa_unggah' => $this->reimburse->bolehUnggah($user, $spj, $p),
                'penginapan_terpakai' => $this->reimburse->penginapanTerpakai($p),
                'reimburse_dibayar' => (float) $p->biayas->where('status', SpjBiaya::DIVALIDASI)->sum('nominal_dibayar'),
                'biayas' => $p->biayas->map(fn (SpjBiaya $b) => [
                    'id' => $b->id,
                    'jenis' => $b->jenis,
                    'label_jenis' => $b->labelJenis(),
                    'tanggal' => $b->tanggal,
                    'keterangan' => $b->keterangan,
                    'jumlah_malam' => $b->jumlah_malam,
                    'nominal_nota' => (float) $b->nominal_nota,
                    'nominal_dibayar' => $b->nominal_dibayar === null ? null : (float) $b->nominal_dibayar,
                    'status' => $b->status,
                    'catatan' => $b->catatan,
                    'diunggah_oleh' => $b->pengunggah?->name,
                    'divalidasi_oleh' => $b->validator?->name,
                    'divalidasi_pada' => $b->divalidasi_pada?->toDateTimeString(),
                    'selisih' => $b->selisih ? [
                        'tingkat' => $b->selisih->tingkat,
                        'persen' => (float) $b->selisih->persen,
                        'nota_per_malam' => (float) $b->selisih->nota_per_malam,
                        'tarif_per_malam' => (float) $b->selisih->tarif_per_malam,
                    ] : null,
                    'pratinjau' => $b->status === SpjBiaya::MENUNGGU && $this->reimburse->bolehValidasi($user)
                        ? $this->reimburse->pratinjau($b->setRelation('peserta', $p)) : null,
                    'bisa_hapus' => $this->reimburse->bolehHapus($user, $b->setRelation('peserta', $p->setRelation('spj', $spj))),
                ])->values(),
                // Pembayaran (B7): status per jenis + riwayat transfer; rekening mengikuti RekeningSpj
                'status_pembayaran' => $this->pembayaran->status($p),
                'bisa_lihat_bukti' => $this->pembayaran->bolehLihatBukti($user, $p),
                'pembayarans' => $p->pembayarans->map(fn (SpjPembayaran $b) => [
                    'id' => $b->id,
                    'jenis' => $b->jenis,
                    'label_jenis' => $b->labelJenis(),
                    'nominal' => (float) $b->nominal,
                    'tanggal_transfer' => $b->tanggal_transfer,
                    'rekening' => RekeningSpj::untuk($user, $b->rekening_encrypted, $p->karyawan_id),
                    'dicatat_oleh' => $b->pencatat?->name,
                    'dicatat_pada' => $b->created_at?->toDateTimeString(),
                    'catatan' => $b->catatan,
                    'dibatalkan' => $b->dibatalkan(),
                    'dibatalkan_pada' => $b->dibatalkan_pada?->toDateTimeString(),
                    'dibatalkan_oleh' => $b->pembatal?->name,
                    'alasan_batal' => $b->alasan_batal,
                ])->values(),
            ])->values(),
            'approvals' => $spj->approvals->map(fn (SpjApproval $a) => [
                'id' => $a->id,
                'urutan' => $a->urutan_langkah,
                'label' => $a->label_ttd,
                'penyetuju' => $a->namaPenyetuju(),
                'status' => $a->status,
                'aktif' => $langkahAktif && $a->id === $langkahAktif->id && $spj->status === Spj::STATUS_DIAJUKAN,
                'nama_aktual' => $a->userAktual?->karyawan?->nama_lengkap ?? $a->userAktual?->name,
                'atas_nama' => $a->atasNama?->nama_lengkap,
                'waktu' => $a->waktu_approval?->toDateTimeString(),
                'catatan' => $a->catatan,
            ])->values(),
            'bisaSetujui' => $cek['boleh'],
            // Penjelasan untuk Admin/pengaju/peserta mengapa tombol Setujui tidak tersedia
            'alasanTidakBisa' => ! $cek['boleh'] && $spj->status === Spj::STATUS_DIAJUKAN
                && ((int) $user->role_id === 1 || (int) $spj->dibuat_oleh === (int) $user->id
                    || $spj->pesertas->contains('karyawan_id', $user->karyawan?->id))
                ? $cek['pesan'] : null,
            'atasNama' => $cek['atas_nama']?->nama_lengkap,
            'bisaUbah' => $spj->bisaDiubahOleh($user),
            'bisaCetak' => filled($spj->nomor_surat),
            'bisaValidasiNota' => $spj->status === Spj::STATUS_DISETUJUI && $this->reimburse->bolehValidasi($user),
            'jenisBiaya' => SpjBiaya::JENIS,
            'bisaCatatPembayaran' => $spj->status === Spj::STATUS_DISETUJUI && $this->pembayaran->bolehCatat($user),
        ]);
    }

    /** Rekap selisih nota penginapan vs tarif per provinsi (Admin, HC, Finance). */
    public function rekapSelisih(Request $request, RekapSelisihSpjService $rekap)
    {
        abort_unless(in_array((int) $request->user()->role_id, RekapSelisihSpjService::ROLE_LIHAT, true), 403,
            'Rekap selisih SPJ hanya untuk HC, Finance, dan Admin.');
        $tahun = (int) ($request->input('tahun') ?: now()->year);
        $provinsi = $request->input('provinsi') ?: null;
        $tingkat = in_array($request->input('tingkat'), ['peringatan', 'info'], true) ? $request->input('tingkat') : null;

        return Inertia::render('PerjalananDinas/RekapSelisih', [
            'tahun' => $tahun,
            'filter' => ['provinsi' => $provinsi, 'tingkat' => $tingkat],
            'perProvinsi' => $rekap->perProvinsi($tahun),
            'kejadian' => $rekap->kejadian($tahun, $provinsi, $tingkat),
        ]);
    }

    /** PDF SPJ resmi; hanya untuk SPJ yang sudah bernomor. Rekening mengikuti peran pengunduh. */
    public function pdf(Request $request, Spj $spj)
    {
        $user = $request->user();
        abort_unless($this->bolehLihat($user, $spj), 403, 'Anda tidak berhak melihat SPJ ini.');
        abort_if(blank($spj->nomor_surat), 404, 'PDF tersedia setelah SPJ disetujui penuh dan bernomor.');

        return $this->pdfService->buat($spj, $user)->stream($this->pdfService->nama($spj));
    }

    /** Halaman publik dari QR di PDF: membuktikan SPJ resmi terbit (tanpa rekening). */
    public function verifikasi(string $token)
    {
        $spj = Spj::with(['pesertas:id,spj_id,nama,posisi,departemen,urutan',
            'approvals.userAktual.karyawan:id,user_id,nama_lengkap,nama_posisi'])
            ->where('qr_code_token', $token)->whereNotNull('nomor_surat')->firstOrFail();

        return Inertia::render('PerjalananDinas/Verifikasi', [
            'spj' => [
                'nomor_surat' => $spj->nomor_surat,
                'status' => $spj->status,
                'tujuan' => trim(ucwords((string) $spj->kota).', '.$spj->provinsi, ', '),
                'keperluan' => $spj->keperluan,
                'tgl_berangkat' => $spj->tgl_berangkat,
                'tgl_pulang' => $spj->tgl_pulang,
                'jumlah_hari' => $spj->jumlah_hari,
                'tanggal_terbit' => $spj->tanggal_terbit?->toDateTimeString(),
                'total_uang_harian' => (float) $spj->total_uang_harian,
            ],
            'pesertas' => $spj->pesertas->map(fn ($p) => ['nama' => $p->nama, 'posisi' => $p->posisi, 'departemen' => $p->departemen])->values(),
            'approvals' => $spj->approvals->map(fn (SpjApproval $a) => [
                'label' => $a->label_ttd,
                'status' => $a->status,
                'nama' => $a->userAktual?->karyawan?->nama_lengkap ?? $a->userAktual?->name,
                'posisi' => $a->userAktual?->karyawan?->nama_posisi,
                'waktu' => $a->waktu_approval?->toDateTimeString(),
            ])->values(),
        ]);
    }

    public function store(Request $request)
    {
        $data = $this->validasi($request);
        $spj = DB::transaction(fn () => $this->simpan(new Spj(['dibuat_oleh' => $request->user()->id]), $data));
        $this->audit($request, 'Buat draf SPJ', $spj);

        return $this->setelahSimpan($request, $spj);
    }

    public function edit(Request $request, Spj $spj)
    {
        $this->pastikanBisaUbah($request->user(), $spj);
        $spj->load('pesertas:id,spj_id,karyawan_id,urutan');

        return Inertia::render('PerjalananDinas/Form', $this->dataForm($request->user()) + [
            'spj' => [
                'id' => $spj->id,
                'provinsi' => $spj->provinsi,
                'kota' => $spj->kota,
                'tgl_berangkat' => $spj->tgl_berangkat,
                'tgl_pulang' => $spj->tgl_pulang,
                'keperluan' => $spj->keperluan,
                'tanggal_risalah_awal' => $spj->tanggal_risalah_awal,
                'unit_penerbit_id' => $spj->unit_penerbit_id,
                'peserta' => $spj->pesertas->pluck('karyawan_id')->all(),
                'status' => $spj->status,
                'catatan_revisi' => $spj->catatan_revisi,
            ],
        ]);
    }

    public function update(Request $request, Spj $spj)
    {
        $this->pastikanBisaUbah($request->user(), $spj);
        $data = $this->validasi($request);
        DB::transaction(fn () => $this->simpan($spj, $data));

        return $this->setelahSimpan($request, $spj);
    }

    public function destroy(Request $request, Spj $spj)
    {
        $this->pastikanBisaUbah($request->user(), $spj);
        $this->audit($request, 'Hapus draf SPJ', $spj);
        DB::transaction(function () use ($spj) {
            $spj->approvals()->delete(); // eksplisit, tidak bergantung pada cascade FK
            $spj->pesertas()->delete();
            $spj->delete();
        });

        return redirect()->route('spj.index')->with('success', 'Draf SPJ dihapus.');
    }

    public function ajukan(Request $request, Spj $spj)
    {
        $this->pastikanBisaUbah($request->user(), $spj);
        $galat = DB::transaction(fn () => $this->ajukanSpj($spj));

        if ($galat) {
            return redirect()->back()->withErrors(['ajukan' => implode(' ', $galat)]);
        }
        $this->audit($request, 'Ajukan SPJ', $spj);

        return redirect()->route('spj.show', $spj)->with('success', 'SPJ diajukan dan menunggu persetujuan HC.');
    }

    /** Pratinjau perhitungan untuk form (JSON). Sama persis dengan yang disimpan. */
    public function hitung(Request $request): JsonResponse
    {
        $data = $request->validate([
            'provinsi' => 'required|string',
            'tgl_berangkat' => 'required|date',
            'tgl_pulang' => 'required|date|after_or_equal:tgl_berangkat',
            'peserta' => 'array',
            'peserta.*' => 'integer',
        ]);

        $karyawans = $this->kalkulator->muatKaryawan($data['peserta'] ?? []);
        $hasil = $this->kalkulator->hitung($data['provinsi'], $data['tgl_berangkat'], $data['tgl_pulang'], $karyawans);
        $hasil['peserta'] = $this->tambahRekening($request->user(), $hasil['peserta'], $karyawans);

        return response()->json($hasil);
    }

    // ------------------------------------------------------------------

    private function dataForm(User $user): array
    {
        $karyawans = Karyawan::with(['jabatan:id,nama_jabatan', 'departemen:id,kode_departemen,nama_departemen'])
            ->where('status_aktif', true)
            ->orderBy('nama_lengkap')
            ->get(['id', 'nama_lengkap', 'nama_posisi', 'jabatan_id', 'departemen_id', 'kategori_tarif_spj', 'no_rek_bca_encrypted']);

        return [
            'provinsiList' => MasterTarifSpj::provinsiUangHarian(),
            'unitPenerbits' => UnitPenerbitSurat::aktif()->orderBy('kode')->get(['id', 'kode', 'nama']),
            'defaultUnitPenerbitId' => UnitPenerbitSurat::aktif()->where('kode', 'LDP-HC')->value('id'),
            'karyawans' => $karyawans->map(fn (Karyawan $k) => [
                'id' => $k->id,
                'nama' => $k->nama_lengkap,
                'posisi' => $k->nama_posisi ?: $k->jabatan?->nama_jabatan,
                'departemen' => $k->departemen?->nama_departemen,
                'kode_departemen' => $k->departemen?->kode_departemen,
                'kategori_tarif' => $k->kategori_tarif_spj,
                'rekening' => RekeningSpj::untuk($user, $k->no_rek_bca_encrypted, $k->id),
                'punya_rekening' => RekeningSpj::polos($k->no_rek_bca_encrypted) !== null,
            ])->values(),
            'maksHari' => self::MAKS_HARI,
        ];
    }

    private function validasi(Request $request): array
    {
        $data = $request->validate([
            'provinsi' => ['required', Rule::in(MasterTarifSpj::provinsiUangHarian()->all())],
            'kota' => 'required|string|max:150',
            'tgl_berangkat' => 'required|date_format:Y-m-d',
            'tgl_pulang' => 'required|date_format:Y-m-d|after_or_equal:tgl_berangkat',
            'keperluan' => 'required|string|max:2000',
            'tanggal_risalah_awal' => 'nullable|date_format:Y-m-d',
            'unit_penerbit_id' => ['required', Rule::exists('unit_penerbit_surats', 'id')->where('is_active', true)],
            'peserta' => 'required|array|min:1',
            'peserta.*' => ['integer', 'distinct', Rule::exists('karyawans', 'id')->where('status_aktif', true)],
            'aksi' => 'nullable|in:draf,ajukan',
        ], [
            'provinsi.in' => 'Provinsi belum punya tarif uang harian di Master Tarif SPJ.',
            'peserta.required' => 'Pilih minimal satu peserta.',
            'peserta.min' => 'Pilih minimal satu peserta.',
            'peserta.*.distinct' => 'Peserta tidak boleh dipilih dua kali.',
            'peserta.*.exists' => 'Peserta harus karyawan aktif.',
        ]);

        $hari = Carbon::parse($data['tgl_berangkat'])->diffInDays($data['tgl_pulang']) + 1;
        if ($hari > self::MAKS_HARI) {
            throw ValidationException::withMessages([
                'tgl_pulang' => 'Lama perjalanan maksimal '.self::MAKS_HARI.' hari.',
            ]);
        }

        return $data;
    }

    /** Simpan header + hitung ulang peserta (snapshot) dari server. */
    private function simpan(Spj $spj, array $data): Spj
    {
        $karyawans = $this->kalkulator->muatKaryawan($data['peserta']);
        $hasil = $this->kalkulator->hitung($data['provinsi'], $data['tgl_berangkat'], $data['tgl_pulang'], $karyawans);

        $spj->fill([
            'unit_penerbit_id' => $data['unit_penerbit_id'],
            'provinsi' => $data['provinsi'],
            // Huruf kapital di awal tiap kata ("malang" -> "Malang"); huruf besar lain (mis. "DKI") dipertahankan
            'kota' => ucwords(preg_replace('/\s+/u', ' ', trim($data['kota']))),
            'tgl_berangkat' => $data['tgl_berangkat'],
            'tgl_pulang' => $data['tgl_pulang'],
            'jumlah_hari' => $hasil['hari'],
            'jumlah_malam' => $hasil['malam'],
            'keperluan' => $data['keperluan'],
            'tanggal_risalah_awal' => $data['tanggal_risalah_awal'] ?? null,
            'total_uang_harian' => $hasil['total_uang_harian'],
        ]);
        $spj->status ??= Spj::STATUS_DRAFT;
        $spj->save();

        $rekening = $karyawans->pluck('no_rek_bca_encrypted', 'id');
        $spj->pesertas()->delete();
        foreach ($hasil['peserta'] as $i => $p) {
            $spj->pesertas()->create([
                'karyawan_id' => $p['karyawan_id'],
                'urutan' => $i + 1,
                'nama' => $p['nama'],
                'posisi' => $p['posisi'],
                'departemen' => $p['departemen'],
                'kategori_tarif' => $p['kategori_tarif'],
                'tarif_uang_harian' => $p['tarif_uang_harian'],
                'total_uang_harian' => $p['total_uang_harian'],
                'tarif_penginapan' => $p['tarif_penginapan'],
                'batas_penginapan' => $p['batas_penginapan'],
                'rekening_encrypted' => $rekening[$p['karyawan_id']] ?? null,
            ]);
        }

        return $spj;
    }

    /**
     * Ajukan SPJ: semua peserta wajib punya rekening dan tarif uang harian.
     * Snapshot dihitung ulang & dibekukan di sini. @return string[] daftar galat (kosong = berhasil)
     */
    private function ajukanSpj(Spj $spj): array
    {
        $spj->load('pesertas');
        $data = [
            'provinsi' => $spj->provinsi, 'kota' => $spj->kota, 'tgl_berangkat' => $spj->tgl_berangkat,
            'tgl_pulang' => $spj->tgl_pulang, 'keperluan' => $spj->keperluan,
            'tanggal_risalah_awal' => $spj->tanggal_risalah_awal, 'unit_penerbit_id' => $spj->unit_penerbit_id,
            'peserta' => $spj->pesertas->pluck('karyawan_id')->all(),
        ];
        $this->simpan($spj, $data);
        $spj->load('pesertas');

        $galat = [];
        if ($spj->pesertas->isEmpty()) {
            $galat[] = 'SPJ belum punya peserta.';
        }
        $tanpaRekening = $spj->pesertas->filter(fn ($p) => RekeningSpj::polos($p->rekening_encrypted) === null)->pluck('nama');
        if ($tanpaRekening->isNotEmpty()) {
            $galat[] = 'Belum bisa diajukan: peserta berikut belum punya nomor rekening: '.$tanpaRekening->join(', ')
                .'. Minta HC melengkapi rekening di Data Karyawan.';
        }
        $tanpaTarif = $spj->pesertas->whereNull('tarif_uang_harian')->pluck('nama');
        if ($tanpaTarif->isNotEmpty()) {
            $galat[] = "Tarif uang harian {$spj->provinsi} belum ada untuk: ".$tanpaTarif->join(', ').'. Hubungi HC.';
        }
        $rute = MasterTemplateSurat::whereRaw('UPPER(kode_surat) = ?', ['SPJ-PD'])->orderBy('id')->first()
            ?->ruteApprovals()->get() ?? collect();
        if ($rute->isEmpty()) {
            $galat[] = 'Rute persetujuan SPJ-PD belum diatur di Master Template & Rute. Hubungi HC.';
        }
        if ($galat) {
            return $galat;
        }

        // Langkah persetujuan dibuat ulang dari rute template (juga saat diajukan ulang setelah ditolak)
        $spj->approvals()->delete();
        foreach ($rute as $r) {
            $spj->approvals()->create([
                'urutan_langkah' => $r->urutan_langkah,
                'tipe_penyetuju' => $r->tipe_penyetuju ?? 'jabatan',
                'role_id' => $r->role_id,
                'jabatan_id' => $r->jabatan_id,
                'label_ttd' => $r->label_ttd,
                'status' => SpjApproval::MENUNGGU,
            ]);
        }

        $spj->update(['status' => Spj::STATUS_DIAJUKAN, 'diajukan_pada' => now(), 'catatan_revisi' => null]);

        return [];
    }

    private function setelahSimpan(Request $request, Spj $spj)
    {
        if ($request->input('aksi') !== 'ajukan') {
            return redirect()->route('spj.edit', $spj)->with('success', 'Draf SPJ tersimpan.');
        }

        $galat = DB::transaction(fn () => $this->ajukanSpj($spj));
        if ($galat) {
            return redirect()->route('spj.edit', $spj)
                ->withErrors(['ajukan' => 'Draf tersimpan. '.implode(' ', $galat)]);
        }
        $this->audit($request, 'Ajukan SPJ', $spj);

        return redirect()->route('spj.show', $spj)->with('success', 'SPJ diajukan dan menunggu persetujuan HC.');
    }

    /** Tambahkan rekening (disamarkan sesuai peran) ke baris hasil perhitungan. */
    private function tambahRekening(?User $user, array $peserta, $karyawans): array
    {
        $enc = $karyawans->pluck('no_rek_bca_encrypted', 'id');

        return array_map(fn ($p) => $p + [
            'rekening' => RekeningSpj::untuk($user, $enc[$p['karyawan_id']] ?? null, $p['karyawan_id']),
            'punya_rekening' => RekeningSpj::polos($enc[$p['karyawan_id']] ?? null) !== null,
        ], $peserta);
    }

    private function pastikanBisaUbah(User $user, Spj $spj): void
    {
        abort_unless($spj->bisaDiubahOleh($user), 403,
            in_array($spj->status, [Spj::STATUS_DRAFT, Spj::STATUS_DITOLAK], true)
                ? 'Hanya pembuat SPJ yang dapat mengubah SPJ ini.'
                : 'SPJ yang sudah diajukan tidak dapat diubah.');
    }

    private function bolehLihat(User $user, Spj $spj): bool
    {
        return Spj::whereKey($spj->id)->terlihatOleh($user, $this->otorisasi->idsMenungguUser($user))->exists();
    }

    private function audit(Request $request, string $aksi, Spj $spj): void
    {
        AuditTrail::create([
            'user_id' => $request->user()->id,
            'modul' => 'SPJ Perjalanan Dinas',
            'aksi' => Str::limit($aksi, 50, ''),
            'data_lama' => null,
            'data_baru' => json_encode(['spj_id' => $spj->id, 'status' => $spj->status, 'total_uang_harian' => (float) $spj->total_uang_harian]),
            'waktu' => now(),
        ]);
    }
}
