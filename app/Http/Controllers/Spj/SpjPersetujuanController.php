<?php

namespace App\Http\Controllers\Spj;

use App\Http\Controllers\Controller;
use App\Models\AuditTrail;
use App\Models\Spj;
use App\Models\SpjApproval;
use App\Services\PenomoranSuratService;
use App\Services\Spj\OtorisasiApprovalSpj;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Persetujuan SPJ: langkah dari rute template SPJ-PD (HC -> Finance -> Direktur).
 * Nomor SPJ-PD terbit lewat PenomoranSuratService di persetujuan terakhir.
 */
class SpjPersetujuanController extends Controller
{
    public function __construct(private OtorisasiApprovalSpj $otorisasi) {}

    public function approve(Request $request, Spj $spj)
    {
        $request->validate([
            'jenis_ttd' => 'nullable|in:qr_code,canvas,upload_gambar',
            'catatan' => 'nullable|string|max:1000',
            'ttd_file' => 'nullable|image|mimes:png,jpg,jpeg|max:2048',
        ]);

        $user = $request->user();
        $langkah = $spj->langkahAktif();
        $cek = $this->otorisasi->periksa($spj, $user, $langkah);
        abort_unless($cek['boleh'], 403, $cek['pesan']);

        $jenisTtd = $request->input('jenis_ttd') ?: 'qr_code';
        $ttdPath = $this->simpanTtd($request, $jenisTtd, $langkah);

        try {
            $nomor = DB::transaction(function () use ($spj, $langkah, $user, $cek, $request, $jenisTtd, $ttdPath) {
                [$spj, $aktif] = $this->kunci($spj, $langkah);

                $aktif->update([
                    'status' => SpjApproval::DISETUJUI,
                    'user_id_aktual' => $user->id,
                    'atas_nama_karyawan_id' => $cek['atas_nama']?->id,
                    'waktu_approval' => now(),
                    'catatan' => $request->input('catatan') ?: ($cek['atas_nama'] ? "Disetujui oleh Plt. atas nama {$cek['atas_nama']->nama_lengkap}." : null),
                    'jenis_ttd' => $jenisTtd,
                    'ttd_image_path' => $ttdPath,
                ]);

                if ($spj->approvals()->where('status', SpjApproval::MENUNGGU)->exists()) {
                    return null;
                }

                // Persetujuan terakhir: terbitkan nomor resmi SPJ-PD (bulan & tahun = waktu terbit)
                $waktu = now();
                $nomor = app(PenomoranSuratService::class)
                    ->terbitkan('SPJ-PD', $spj->unitPenerbit->kode, $waktu, $spj);
                $spj->update([
                    'nomor_surat' => $nomor,
                    'status' => Spj::STATUS_DISETUJUI,
                    'tanggal_terbit' => $waktu,
                    'qr_code_token' => (string) Str::uuid(),
                ]);

                return $nomor;
            }, 3);
        } catch (\DomainException $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }

        $this->audit($request, $nomor ? 'Setujui & terbitkan SPJ' : 'Setujui langkah SPJ', $spj, $langkah, $nomor);

        return redirect()->route('spj.show', $spj)->with('success', $nomor
            ? "SPJ disetujui penuh. Nomor resmi: {$nomor}"
            : 'Persetujuan disimpan dan diteruskan ke tahap berikutnya.');
    }

    public function tolak(Request $request, Spj $spj)
    {
        $request->validate(['alasan' => 'required|string|min:5|max:1000'], [
            'alasan.required' => 'Alasan penolakan wajib diisi.',
            'alasan.min' => 'Alasan penolakan minimal 5 karakter.',
        ]);

        $user = $request->user();
        $langkah = $spj->langkahAktif();
        $cek = $this->otorisasi->periksa($spj, $user, $langkah);
        abort_unless($cek['boleh'], 403, $cek['pesan']);

        try {
            DB::transaction(function () use ($spj, $langkah, $user, $cek, $request) {
                [$spj, $aktif] = $this->kunci($spj, $langkah);
                $aktif->update([
                    'status' => SpjApproval::DITOLAK,
                    'user_id_aktual' => $user->id,
                    'atas_nama_karyawan_id' => $cek['atas_nama']?->id,
                    'waktu_approval' => now(),
                    'catatan' => $request->input('alasan'),
                ]);
                $spj->update(['status' => Spj::STATUS_DITOLAK, 'catatan_revisi' => $request->input('alasan')]);
            }, 3);
        } catch (\DomainException $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }

        $this->audit($request, 'Tolak SPJ', $spj, $langkah, null);

        return redirect()->route('spj.show', $spj)->with('success', 'SPJ ditolak dan dikembalikan ke pengaju untuk direvisi.');
    }

    /**
     * Kunci SPJ & langkah aktif lalu cek ulang (cegah klik ganda / dua penyetuju bersamaan).
     *
     * @return array{0: Spj, 1: SpjApproval}
     */
    private function kunci(Spj $spj, SpjApproval $langkah): array
    {
        $spj = Spj::with('unitPenerbit')->lockForUpdate()->findOrFail($spj->id);
        if ($spj->status !== Spj::STATUS_DIAJUKAN) {
            throw new \DomainException("SPJ ini sudah berstatus {$spj->status}.");
        }
        $aktif = SpjApproval::where('spj_id', $spj->id)->where('status', SpjApproval::MENUNGGU)
            ->orderBy('urutan_langkah')->lockForUpdate()->first();
        if (! $aktif || $aktif->id !== $langkah->id) {
            throw new \DomainException('Tahap persetujuan ini sudah diproses. Muat ulang halaman.');
        }

        return [$spj, $aktif];
    }

    private function simpanTtd(Request $request, string $jenis, SpjApproval $langkah): ?string
    {
        if ($jenis === 'canvas' && $request->filled('ttd_base64')) {
            $bagian = explode(';base64,', (string) $request->input('ttd_base64'));
            $biner = base64_decode(end($bagian), true);
            if ($biner !== false && @imagecreatefromstring($biner)) {
                $path = "spj/ttd/ttd_spj_{$langkah->id}_".time().'.png';
                Storage::disk('public')->put($path, $biner);

                return $path;
            }
        }
        if ($jenis === 'upload_gambar' && $request->hasFile('ttd_file')) {
            return $request->file('ttd_file')->store('spj/ttd', 'public');
        }

        return null;
    }

    private function audit(Request $request, string $aksi, Spj $spj, SpjApproval $langkah, ?string $nomor): void
    {
        AuditTrail::create([
            'user_id' => $request->user()->id,
            'modul' => 'SPJ Perjalanan Dinas',
            'aksi' => Str::limit($aksi, 50, ''),
            'data_lama' => null,
            'data_baru' => json_encode(['spj_id' => $spj->id, 'langkah' => $langkah->label_ttd, 'nomor' => $nomor]),
            'waktu' => now(),
        ]);
    }
}
