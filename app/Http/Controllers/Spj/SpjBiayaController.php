<?php

namespace App\Http\Controllers\Spj;

use App\Http\Controllers\Controller;
use App\Models\AuditTrail;
use App\Models\Spj;
use App\Models\SpjBiaya;
use App\Models\SpjPeserta;
use App\Services\Spj\OtorisasiApprovalSpj;
use App\Services\Spj\ReimburseSpjService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

/**
 * Nota & reimburse SPJ: unggah (pengaju/koordinator/peserta), validasi & tolak (Finance).
 * Berkas nota disimpan di disk privat 'local' dan hanya dibuka lewat route berotorisasi.
 */
class SpjBiayaController extends Controller
{
    public function __construct(
        private ReimburseSpjService $reimburse,
        private OtorisasiApprovalSpj $otorisasi,
    ) {}

    public function store(Request $request, Spj $spj)
    {
        $data = $request->validate([
            'spj_peserta_id' => ['required', Rule::exists('spj_pesertas', 'id')->where('spj_id', $spj->id)],
            'jenis' => ['required', Rule::in(array_keys(SpjBiaya::JENIS))],
            'tanggal' => ['required', 'date', 'after_or_equal:'.$spj->tgl_berangkat, 'before_or_equal:'.$spj->tgl_pulang],
            'keterangan' => ['nullable', 'string', 'max:255'],
            'jumlah_malam' => ['required_if:jenis,penginapan', 'nullable', 'integer', 'min:1', 'max:'.max(1, (int) $spj->jumlah_malam)],
            'nominal_nota' => ['required', 'numeric', 'min:1', 'max:999999999'],
            'file_nota' => ['required', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
        ], [
            'tanggal.after_or_equal' => 'Tanggal nota harus dalam rentang perjalanan.',
            'tanggal.before_or_equal' => 'Tanggal nota harus dalam rentang perjalanan.',
            'jumlah_malam.required_if' => 'Jumlah malam wajib diisi untuk nota penginapan.',
            'jumlah_malam.max' => 'Jumlah malam melebihi lama perjalanan ('.$spj->jumlah_malam.' malam).',
            'file_nota.required' => 'Berkas nota wajib diunggah.',
        ]);

        $peserta = SpjPeserta::findOrFail($data['spj_peserta_id']);
        abort_unless($this->reimburse->bolehUnggah($request->user(), $spj, $peserta), 403,
            'Nota hanya dapat diunggah oleh pengaju, koordinator, atau peserta yang bersangkutan setelah SPJ disetujui.');

        $path = $request->file('file_nota')->store("spj/nota/{$spj->id}", 'local');
        $biaya = SpjBiaya::create([
            'spj_peserta_id' => $peserta->id,
            'jenis' => $data['jenis'],
            'tanggal' => $data['tanggal'],
            'keterangan' => $data['keterangan'] ?? null,
            'jumlah_malam' => $data['jenis'] === SpjBiaya::PENGINAPAN ? (int) $data['jumlah_malam'] : null,
            'nominal_nota' => $data['nominal_nota'],
            'file_nota_path' => $path,
            'status' => SpjBiaya::MENUNGGU,
            'diunggah_oleh' => $request->user()->id,
        ]);
        $this->audit($request, 'Unggah nota SPJ', $biaya);

        return back()->with('success', 'Nota diunggah dan menunggu validasi Finance.');
    }

    public function destroy(Request $request, SpjBiaya $biaya)
    {
        $biaya->load('peserta.spj');
        abort_unless($this->reimburse->bolehHapus($request->user(), $biaya), 403,
            'Nota hanya dapat dihapus oleh pengunggah atau pengaju selama masih menunggu validasi.');

        Storage::disk('local')->delete($biaya->file_nota_path);
        $this->audit($request, 'Hapus nota SPJ', $biaya);
        $biaya->delete();

        return back()->with('success', 'Nota dihapus.');
    }

    /** Buka berkas nota: hanya untuk yang berhak melihat SPJ-nya. */
    public function berkas(Request $request, SpjBiaya $biaya)
    {
        $spj = $biaya->peserta->spj;
        $user = $request->user();
        abort_unless(Spj::whereKey($spj->id)->terlihatOleh($user, $this->otorisasi->idsMenungguUser($user))->exists(), 403);
        abort_unless(Storage::disk('local')->exists($biaya->file_nota_path), 404, 'Berkas nota tidak ditemukan.');

        return Storage::disk('local')->response($biaya->file_nota_path);
    }

    public function validasi(Request $request, SpjBiaya $biaya)
    {
        abort_unless($this->reimburse->bolehValidasi($request->user()), 403, 'Hanya Finance yang dapat memvalidasi nota SPJ.');
        $data = $request->validate([
            'nominal_dibayar' => ['nullable', 'numeric', 'min:0'],
            'catatan' => ['nullable', 'string', 'max:500'],
        ]);

        try {
            $biaya = $this->reimburse->validasi(
                $biaya, $request->user(),
                isset($data['nominal_dibayar']) ? (float) $data['nominal_dibayar'] : null,
                $data['catatan'] ?? null,
            );
        } catch (\DomainException $e) {
            return back()->with('error', $e->getMessage());
        }
        $this->audit($request, 'Validasi nota SPJ', $biaya);

        $pesan = 'Nota divalidasi. Dibayar Rp '.number_format((float) $biaya->nominal_dibayar, 0, ',', '.');
        if ($biaya->selisih) {
            $pesan .= $biaya->selisih->tingkat === 'peringatan'
                ? ' · Peringatan: nota penginapan di atas tarif ('.$biaya->selisih->persen.'%).'
                : ' · Info: nota penginapan di bawah tarif ('.$biaya->selisih->persen.'%).';
        }

        return back()->with('success', $pesan);
    }

    public function tolak(Request $request, SpjBiaya $biaya)
    {
        abort_unless($this->reimburse->bolehValidasi($request->user()), 403, 'Hanya Finance yang dapat menolak nota SPJ.');
        $data = $request->validate(['alasan' => 'required|string|min:5|max:500'], [
            'alasan.required' => 'Alasan penolakan nota wajib diisi.',
            'alasan.min' => 'Alasan penolakan minimal 5 karakter.',
        ]);

        try {
            $biaya = $this->reimburse->tolak($biaya, $request->user(), $data['alasan']);
        } catch (\DomainException $e) {
            return back()->with('error', $e->getMessage());
        }
        $this->audit($request, 'Tolak nota SPJ', $biaya);

        return back()->with('success', 'Nota ditolak. Pengunggah dapat mengunggah nota pengganti.');
    }

    private function audit(Request $request, string $aksi, SpjBiaya $biaya): void
    {
        AuditTrail::create([
            'user_id' => $request->user()->id,
            'modul' => 'SPJ Perjalanan Dinas',
            'aksi' => Str::limit($aksi, 50, ''),
            'data_lama' => null,
            'data_baru' => json_encode([
                'spj_biaya_id' => $biaya->id, 'spj_peserta_id' => $biaya->spj_peserta_id, 'jenis' => $biaya->jenis,
                'nominal_nota' => (float) $biaya->nominal_nota, 'nominal_dibayar' => $biaya->nominal_dibayar === null ? null : (float) $biaya->nominal_dibayar,
                'status' => $biaya->status,
            ]),
            'waktu' => now(),
        ]);
    }
}
