<?php

namespace App\Http\Controllers\Spj;

use App\Http\Controllers\Controller;
use App\Models\AuditTrail;
use App\Models\Spj;
use App\Models\SpjRisalahLampiran;
use App\Models\User;
use App\Services\Spj\OtorisasiApprovalSpj;
use App\Services\Spj\RisalahSpjService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

/** Koordinator SPJ, Risalah Perjalanan Dinas (isi, lampiran gambar per tanggal), dan PDF risalah. */
class SpjRisalahController extends Controller
{
    private const MAKS_LAMPIRAN_PER_TANGGAL = 10;

    public function __construct(
        private RisalahSpjService $risalah,
        private OtorisasiApprovalSpj $otorisasi,
    ) {}

    /** Ganti koordinator (pengaju atau HC) — harus salah satu peserta, atau dikosongkan. */
    public function koordinator(Request $request, Spj $spj)
    {
        abort_unless($this->risalah->bolehUbahKoordinator($request->user(), $spj), 403,
            'Koordinator hanya dapat diubah oleh pengaju atau HC selama SPJ belum Selesai.');
        $data = $request->validate([
            'koordinator_karyawan_id' => ['nullable', 'integer', Rule::in($spj->pesertas()->pluck('karyawan_id')->all())],
        ], ['koordinator_karyawan_id.in' => 'Koordinator harus salah satu peserta SPJ.']);

        $lama = $spj->koordinator_karyawan_id;
        $spj->update(['koordinator_karyawan_id' => $data['koordinator_karyawan_id'] ?? null]);
        $this->audit($request, 'Ubah koordinator SPJ', $spj, ['koordinator_lama' => $lama, 'koordinator_baru' => $spj->koordinator_karyawan_id]);

        return back()->with('success', 'Koordinator SPJ diperbarui.');
    }

    public function edit(Request $request, Spj $spj)
    {
        $user = $request->user();
        $alasan = $this->risalah->alasanTidakBisaIsi($user, $spj);
        abort_if($alasan !== null, 403, $alasan ?? '');

        $spj->load(['pesertas', 'koordinator:id,nama_lengkap', 'risalah.details.lampirans']);
        $r = $spj->risalah;

        return Inertia::render('PerjalananDinas/Risalah', [
            'spj' => [
                'id' => $spj->id,
                'nomor_surat' => $spj->nomor_surat,
                'kota' => $spj->kota,
                'provinsi' => $spj->provinsi,
                'tgl_berangkat' => $spj->tgl_berangkat,
                'tgl_pulang' => $spj->tgl_pulang,
                'koordinator' => $spj->koordinator?->nama_lengkap,
            ],
            'risalah' => [
                'topik' => $r?->topik ?? '',
                'tempat' => $r?->tempat ?? '',
                'waktu' => $r?->waktu ?? '',
            ],
            'hari' => collect($this->risalah->tanggalPerjalanan($spj))->map(function (string $tgl) use ($r) {
                $d = $r?->details->first(fn ($x) => Carbon::parse($x->tanggal)->toDateString() === $tgl);

                return [
                    'tanggal' => $tgl,
                    'judul' => Carbon::parse($tgl)->locale('id')->translatedFormat('l, d F Y'),
                    'kegiatan' => $d?->kegiatan ?? [],
                    'lampirans' => $d ? $d->lampirans->map(fn ($l) => [
                        'id' => $l->id, 'nama' => $l->nama_asli, 'ukuran' => $l->ukuran,
                    ])->values() : [],
                ];
            })->values(),
            'pesertas' => $spj->pesertas->map(fn ($p) => ['nama' => $p->nama, 'posisi' => $p->posisi])->values(),
            'maksLampiran' => self::MAKS_LAMPIRAN_PER_TANGGAL,
        ]);
    }

    public function update(Request $request, Spj $spj)
    {
        $alasan = $this->risalah->alasanTidakBisaIsi($request->user(), $spj);
        abort_if($alasan !== null, 403, $alasan ?? '');

        $tanggal = $this->risalah->tanggalPerjalanan($spj);
        $data = $request->validate([
            'topik' => 'required|string|max:255',
            'tempat' => 'required|string|max:255',
            'waktu' => 'required|string|max:150',
            'kegiatan' => 'required|array',
            'kegiatan.*' => 'nullable|array|max:50',
            'kegiatan.*.*' => 'nullable|string|max:500',
        ], [
            'topik.required' => 'Topik wajib diisi.',
            'tempat.required' => 'Tempat wajib diisi.',
            'waktu.required' => 'Waktu wajib diisi (mis. "Sesuai Rundown PD").',
        ]);

        $adaKegiatan = collect($data['kegiatan'])->only($tanggal)
            ->flatten()->map(fn ($k) => trim((string) $k))->filter()->isNotEmpty();
        if (! $adaKegiatan) {
            return back()->withErrors(['kegiatan' => 'Isi minimal satu kegiatan pada salah satu tanggal perjalanan.']);
        }

        $this->risalah->simpan($spj, $request->user(), $data, $data['kegiatan']);
        $this->audit($request, 'Simpan risalah SPJ', $spj, ['topik' => $data['topik']]);

        return redirect()->route('spj.show', $spj)->with('success', 'Risalah perjalanan dinas disimpan.');
    }

    public function lampiranStore(Request $request, Spj $spj)
    {
        $alasan = $this->risalah->alasanTidakBisaIsi($request->user(), $spj);
        abort_if($alasan !== null, 403, $alasan ?? '');

        $data = $request->validate([
            'tanggal' => ['required', Rule::in($this->risalah->tanggalPerjalanan($spj))],
            'gambar' => 'required|array|min:1|max:'.self::MAKS_LAMPIRAN_PER_TANGGAL,
            'gambar.*' => 'file|mimes:jpg,jpeg,png|max:5120',
        ], [
            'tanggal.in' => 'Tanggal harus salah satu tanggal perjalanan.',
            'gambar.required' => 'Pilih minimal satu gambar.',
            'gambar.*.mimes' => 'Lampiran harus gambar JPG atau PNG.',
            'gambar.*.max' => 'Ukuran tiap gambar maksimal 5 MB.',
        ]);

        $detail = $this->risalah->detailUntuk($spj, $data['tanggal'], $request->user());
        if ($detail->lampirans()->count() + count($data['gambar']) > self::MAKS_LAMPIRAN_PER_TANGGAL) {
            return back()->withErrors(['gambar' => 'Maksimal '.self::MAKS_LAMPIRAN_PER_TANGGAL.' gambar per tanggal.']);
        }
        foreach ($data['gambar'] as $file) {
            $detail->lampirans()->create([
                'path' => $this->risalah->simpanGambar($file, $spj),
                'nama_asli' => Str::limit($file->getClientOriginalName(), 250, ''),
                'ukuran' => $file->getSize(),
                'diunggah_oleh' => $request->user()->id,
            ]);
        }
        $this->audit($request, 'Unggah lampiran risalah SPJ', $spj, ['tanggal' => $data['tanggal'], 'jumlah' => count($data['gambar'])]);

        return back()->with('success', count($data['gambar']).' gambar ditambahkan.');
    }

    public function lampiranDestroy(Request $request, SpjRisalahLampiran $lampiran)
    {
        $spj = $lampiran->detail->risalah->spj;
        $alasan = $this->risalah->alasanTidakBisaIsi($request->user(), $spj);
        abort_if($alasan !== null, 403, $alasan ?? '');

        Storage::disk('local')->delete($lampiran->path);
        $lampiran->delete();
        $this->audit($request, 'Hapus lampiran risalah SPJ', $spj, ['lampiran_id' => $lampiran->id]);

        return back()->with('success', 'Gambar dihapus.');
    }

    /** Lihat gambar lampiran: siapa pun yang berhak melihat SPJ. */
    public function lampiranLihat(Request $request, SpjRisalahLampiran $lampiran)
    {
        $spj = $lampiran->detail->risalah->spj;
        abort_unless($this->bolehLihat($request->user(), $spj), 403);
        abort_unless(Storage::disk('local')->exists($lampiran->path), 404, 'Berkas lampiran tidak ditemukan.');

        return Storage::disk('local')->response($lampiran->path);
    }

    public function pdf(Request $request, Spj $spj)
    {
        abort_unless($this->bolehLihat($request->user(), $spj), 403, 'Anda tidak berhak melihat SPJ ini.');
        abort_unless($this->risalah->risalahTerisi($spj), 404, 'Risalah belum diisi.');

        return $this->risalah->buatPdf($spj)->stream($this->risalah->namaPdf($spj));
    }

    private function bolehLihat(User $user, Spj $spj): bool
    {
        return Spj::whereKey($spj->id)->terlihatOleh($user, $this->otorisasi->idsMenungguUser($user))->exists();
    }

    private function audit(Request $request, string $aksi, Spj $spj, array $data = []): void
    {
        AuditTrail::create([
            'user_id' => $request->user()->id,
            'modul' => 'SPJ Perjalanan Dinas',
            'aksi' => Str::limit($aksi, 50, ''),
            'data_lama' => null,
            'data_baru' => json_encode(['spj_id' => $spj->id] + $data),
            'waktu' => now(),
        ]);
    }
}
