<?php

namespace App\Http\Controllers\Spj;

use App\Http\Controllers\Controller;
use App\Models\AuditTrail;
use App\Models\Spj;
use App\Services\Spj\PenutupanSpjService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

/** Penutupan SPJ: Tandai Selesai (Finance) dan Batalkan (pengaju sebelum disetujui; HC setelah disetujui). */
class SpjPenutupanController extends Controller
{
    public function __construct(private PenutupanSpjService $penutupan) {}

    public function selesai(Request $request, Spj $spj)
    {
        abort_unless($this->penutupan->bolehMenandaiSelesai($request->user()), 403, 'Hanya Finance yang dapat menandai SPJ Selesai.');

        try {
            $spj = $this->penutupan->selesaikan($spj, $request->user());
        } catch (\DomainException $e) {
            return back()->with('error', $e->getMessage());
        }
        $this->audit($request, 'Tandai SPJ Selesai', $spj, ['status_lama' => Spj::STATUS_DISETUJUI]);

        return back()->with('success', 'SPJ ditandai Selesai. Nota, pembayaran, risalah, dan koordinator kini terkunci.');
    }

    public function batal(Request $request, Spj $spj)
    {
        $tolak = $this->penutupan->alasanTidakBisaBatal($request->user(), $spj);
        abort_if($tolak !== null, 403, $tolak ?? '');

        $wajib = $this->penutupan->alasanWajib($spj);
        $data = $request->validate([
            'alasan' => [$wajib ? 'required' : 'nullable', 'string', 'min:5', 'max:1000'],
        ], [
            'alasan.required' => 'Alasan pembatalan wajib diisi untuk SPJ yang sudah disetujui.',
            'alasan.min' => 'Alasan pembatalan minimal 5 karakter.',
        ]);

        $statusLama = $spj->status;
        try {
            $spj = $this->penutupan->batalkan($spj, $request->user(), $data['alasan'] ?? null);
        } catch (\DomainException $e) {
            return back()->with('error', $e->getMessage());
        }
        $this->audit($request, 'Batalkan SPJ', $spj, ['status_lama' => $statusLama, 'alasan' => $spj->alasan_batal]);

        return redirect()->route('spj.show', $spj)->with('success', $spj->nomor_surat
            ? "SPJ dibatalkan. Nomor {$spj->nomor_surat} tetap tercatat dan tidak dipakai ulang."
            : 'SPJ dibatalkan.');
    }

    private function audit(Request $request, string $aksi, Spj $spj, array $lama): void
    {
        AuditTrail::create([
            'user_id' => $request->user()->id,
            'modul' => 'SPJ Perjalanan Dinas',
            'aksi' => Str::limit($aksi, 50, ''),
            'data_lama' => json_encode(['spj_id' => $spj->id] + $lama),
            'data_baru' => json_encode(['spj_id' => $spj->id, 'nomor' => $spj->nomor_surat, 'status' => $spj->status]),
            'waktu' => now(),
        ]);
    }
}
