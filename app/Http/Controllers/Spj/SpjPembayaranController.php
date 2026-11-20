<?php

namespace App\Http\Controllers\Spj;

use App\Http\Controllers\Controller;
use App\Models\AuditTrail;
use App\Models\Spj;
use App\Models\SpjPembayaran;
use App\Models\SpjPeserta;
use App\Services\Spj\PembayaranSpjService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

/**
 * Pencatatan pembayaran SPJ oleh Finance (uang harian & reimburse) dengan bukti transfer di disk privat.
 * Semua pencatatan & pembatalan dicatat ke AuditTrail.
 */
class SpjPembayaranController extends Controller
{
    public function __construct(private PembayaranSpjService $pembayaran) {}

    public function store(Request $request, Spj $spj)
    {
        abort_unless($this->pembayaran->bolehCatat($request->user()), 403, 'Hanya Finance yang dapat mencatat pembayaran SPJ.');

        $data = $request->validate([
            'spj_peserta_id' => ['required', Rule::exists('spj_pesertas', 'id')->where('spj_id', $spj->id)],
            'jenis' => ['required', Rule::in(array_keys(SpjPembayaran::JENIS))],
            'nominal' => ['required', 'numeric', 'min:1', 'max:999999999'],
            'tanggal_transfer' => ['required', 'date', 'before_or_equal:today'],
            'bukti_transfer' => ['required', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
            'catatan' => ['nullable', 'string', 'max:500'],
        ], [
            'tanggal_transfer.before_or_equal' => 'Tanggal transfer tidak boleh di masa depan.',
            'bukti_transfer.required' => 'Bukti transfer wajib diunggah.',
        ]);

        $peserta = SpjPeserta::findOrFail($data['spj_peserta_id']);
        $path = $request->file('bukti_transfer')->store("spj/bukti-transfer/{$spj->id}", 'local');

        try {
            $bayar = $this->pembayaran->catat(
                $peserta, $request->user(), $data['jenis'], (float) $data['nominal'],
                $data['tanggal_transfer'], $path, $data['catatan'] ?? null,
            );
        } catch (\DomainException $e) {
            Storage::disk('local')->delete($path);

            return back()->with('error', $e->getMessage());
        }

        $this->audit($request, 'Catat pembayaran SPJ', null, $bayar);

        return back()->with('success', "Pembayaran {$bayar->labelJenis()} {$peserta->nama} sebesar Rp "
            .number_format((float) $bayar->nominal, 0, ',', '.').' dicatat.');
    }

    /**
     * Batalkan pencatatan yang keliru (Finance), selama SPJ Disetujui. Hanya PENANDAAN: baris & bukti transfer
     * tetap disimpan (tampil "Dibatalkan" di riwayat), tidak dihitung ke total. Alasan wajib, tercatat di AuditTrail.
     */
    public function destroy(Request $request, SpjPembayaran $pembayaran)
    {
        abort_unless($this->pembayaran->bolehCatat($request->user()), 403, 'Hanya Finance yang dapat membatalkan pembayaran SPJ.');
        $data = $request->validate(['alasan' => 'required|string|min:5|max:500'], [
            'alasan.required' => 'Alasan pembatalan wajib diisi.',
            'alasan.min' => 'Alasan pembatalan minimal 5 karakter.',
        ]);
        try {
            $batal = $this->pembayaran->batalkan($pembayaran, $request->user(), $data['alasan']);
        } catch (\DomainException $e) {
            return back()->with('error', $e->getMessage());
        }
        $this->audit($request, 'Batalkan pembayaran SPJ', $pembayaran, $batal, $data['alasan']);

        return back()->with('success', 'Pencatatan pembayaran dibatalkan.');
    }

    /** Bukti transfer (termasuk pembayaran yang dibatalkan): Admin/HC/Finance dan peserta pemilik pembayaran. */
    public function bukti(Request $request, SpjPembayaran $pembayaran)
    {
        abort_unless($this->pembayaran->bolehLihatBukti($request->user(), $pembayaran->peserta), 403,
            'Bukti transfer hanya dapat dilihat HC, Finance, Admin, atau peserta penerima.');
        abort_unless(Storage::disk('local')->exists($pembayaran->bukti_transfer_path), 404, 'Berkas bukti transfer tidak ditemukan.');

        return Storage::disk('local')->response($pembayaran->bukti_transfer_path);
    }

    private function audit(Request $request, string $aksi, ?SpjPembayaran $lama, ?SpjPembayaran $baru, ?string $alasan = null): void
    {
        $ringkas = fn (?SpjPembayaran $p) => $p ? [
            'spj_pembayaran_id' => $p->id, 'spj_peserta_id' => $p->spj_peserta_id, 'jenis' => $p->jenis,
            'nominal' => (float) $p->nominal, 'tanggal_transfer' => (string) $p->tanggal_transfer,
            'bukti_transfer_path' => $p->bukti_transfer_path,
            'dibatalkan_pada' => $p->dibatalkan_pada?->toDateTimeString(),
        ] : null;

        AuditTrail::create([
            'user_id' => $request->user()->id,
            'modul' => 'SPJ Perjalanan Dinas',
            'aksi' => Str::limit($aksi, 50, ''),
            'data_lama' => $lama ? json_encode($ringkas($lama)) : null,
            'data_baru' => json_encode(array_filter([...($ringkas($baru) ?? []), 'alasan' => $alasan], fn ($v) => $v !== null)),
            'waktu' => now(),
        ]);
    }
}
