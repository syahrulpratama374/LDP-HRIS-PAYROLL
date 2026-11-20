<?php

namespace App\Services\Spj;

use App\Models\PengaturanSuratLayout;
use App\Models\Spj;
use App\Models\SpjApproval;
use App\Models\User;
use App\Services\PdfGambarService;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

/**
 * PDF "SPJ BIAYA PERJALANAN DINAS" (meniru dokumen perusahaan 047/SPJ-PD/LDP-HC/VIII/2026).
 * Semua data diambil dari SPJ (snapshot peserta + approver asli); rekening mengikuti peran pengunduh
 * (RekeningSpj). Bagian AKOMODASI berisi nota reimburse yang sudah divalidasi Finance (kosong saat terbit).
 * Subtotal, TOTAL, dan Terbilang SELALU dihitung view dari baris yang ditampilkan (SpjPdfService::ringkasan),
 * tidak dari total tersimpan, agar angka di PDF tidak mungkin berbeda dari rinciannya.
 */
class SpjPdfService
{
    public function nama(Spj $spj): string
    {
        return 'SPJ_'.str_replace(['/', '\\'], '_', (string) ($spj->nomor_surat ?? $spj->id)).'.pdf';
    }

    public function buat(Spj $spj, ?User $viewer): \Barryvdh\DomPDF\PDF
    {
        return Pdf::loadView('pdf.spj', $this->data($spj, $viewer))->setPaper('a4', 'portrait');
    }

    /** Data view pdf.spj (dipisah agar mudah diuji). */
    public function data(Spj $spj, ?User $viewer): array
    {
        $spj->loadMissing([
            'pesertas',
            'approvals.userAktual.karyawan.jabatan',
            'approvals.atasNama',
            'approvals.jabatan',
            'approvals.role',
        ]);
        $layout = PengaturanSuratLayout::where('is_active', true)->first();

        $berangkat = Carbon::parse($spj->tgl_berangkat)->locale('id');
        $pulang = Carbon::parse($spj->tgl_pulang)->locale('id');
        $rentangSingkat = $this->rentangSingkat($berangkat, $pulang);

        $uangHarian = $spj->pesertas->values()->map(fn ($p) => [
            'perincian' => 'Uang Harian '.$p->nama,
            'tgl' => $rentangSingkat,
            'harian' => $p->tarif_uang_harian === null ? null : (float) $p->tarif_uang_harian,
            'hari' => (int) $spj->jumlah_hari,
            'total' => (float) $p->total_uang_harian,
            'ket' => 'Transfer // '.(RekeningSpj::untuk($viewer, $p->rekening_encrypted, $p->karyawan_id) ?? 'rekening belum diisi')
                .' ('.$p->nama.')',
        ])->all();

        // Nota reimburse yang SUDAH divalidasi Finance (B6); kosong saat SPJ baru terbit.
        $akomodasi = app(ReimburseSpjService::class)->barisAkomodasiPdf($spj, $viewer);

        $departemen = $spj->pesertas->pluck('departemen')->filter()->unique()->implode(', ');

        $latarSrc = PdfGambarService::dataUri($layout->latar_kop_path ?? null);

        return [
            'spj' => $spj,
            'layout' => $layout,
            'latarSrc' => $latarSrc,
            'nomor' => $spj->nomor_surat,
            'tanggalRisalah' => $spj->tanggal_risalah_awal
                ? Carbon::parse($spj->tanggal_risalah_awal)->locale('id')->translatedFormat('d F Y')
                : null,
            'pesertas' => $spj->pesertas->map(fn ($p) => ['nama' => $p->nama, 'posisi' => $p->posisi ?: '-'])->all(),
            'departemen' => $departemen !== '' ? $departemen : '-',
            'tujuan' => trim(ucwords((string) $spj->kota).', '.$spj->provinsi, ', '),
            'keperluan' => $spj->keperluan,
            'tanggalPerjalanan' => $berangkat->translatedFormat('l, d F Y').' - '.$pulang->translatedFormat('l, d F Y')
                .' ('.$spj->jumlah_hari.' hari)',
            'uangHarian' => $uangHarian,
            'akomodasi' => $akomodasi,
            'tempatTanggal' => ($layout->kota_surat ?? 'Bantul').', '
                .Carbon::parse($spj->tanggal_terbit ?? now())->locale('id')->translatedFormat('d F Y'),
            'penandatangan' => $this->penandatangan($spj),
            'qrSrc' => $this->qr($spj),
        ];
    }

    /**
     * Subtotal, total, dan terbilang dari baris yang sama dengan yang ditampilkan.
     *
     * @return array{subtotalUangHarian: float, subtotalAkomodasi: float, total: float, terbilang: string}
     */
    public static function ringkasan(array $uangHarian, array $akomodasi): array
    {
        $uh = (float) array_sum(array_column($uangHarian, 'total'));
        $ak = (float) array_sum(array_column($akomodasi, 'total'));

        return [
            'subtotalUangHarian' => $uh,
            'subtotalAkomodasi' => $ak,
            'total' => $uh + $ak,
            'terbilang' => \App\Support\Terbilang::rupiah($uh + $ak),
        ];
    }

    /** "27 - 29 Nov 2026", "30 Nov - 2 Des 2026", atau "30 Des 2026 - 2 Jan 2027". */
    private function rentangSingkat(Carbon $a, Carbon $b): string
    {
        if ($a->isSameDay($b)) {
            return $a->translatedFormat('j M Y');
        }
        if ($a->year !== $b->year) {
            return $a->translatedFormat('j M Y').' - '.$b->translatedFormat('j M Y');
        }
        if ($a->month !== $b->month) {
            return $a->translatedFormat('j M').' - '.$b->translatedFormat('j M Y');
        }

        return $a->format('j').' - '.$b->translatedFormat('j M Y');
    }

    /**
     * Penanda tangan dari approver ASLI (user_id_aktual), bukan dari label langkah. Jabatan memakai
     * nama_posisi (judul di bagan), fallback nama jenjang jabatan. Admin tidak pernah menjadi approver.
     */
    private function penandatangan(Spj $spj): array
    {
        return $spj->approvals->map(function (SpjApproval $a) {
            $disetujui = $a->status === SpjApproval::DISETUJUI;
            $karyawan = $disetujui ? $a->userAktual?->karyawan : null;
            $jabatan = $karyawan ? ($karyawan->nama_posisi ?: ($karyawan->jabatan->nama_jabatan ?? '')) : $a->namaPenyetuju();
            if ($disetujui && $a->atasNama) {
                $jabatan = 'Plt. a.n. '.$a->atasNama->nama_lengkap;
            }
            $pakaiGambar = in_array($a->jenis_ttd, ['canvas', 'upload_gambar'], true);

            return [
                'label' => $a->label_ttd,
                'disetujui' => $disetujui,
                'gambar' => $disetujui && $pakaiGambar ? PdfGambarService::dataUri($a->ttd_image_path) : null,
                'nama' => $karyawan->nama_lengkap ?? ($disetujui ? $a->userAktual?->name : null),
                'jabatan' => $jabatan,
            ];
        })->all();
    }

    private function qr(Spj $spj): ?string
    {
        if (! $spj->qr_code_token) {
            return null;
        }
        $svg = QrCode::format('svg')->size(70)->margin(0)->generate(route('verifikasi.spj', $spj->qr_code_token));

        return 'data:image/svg+xml;base64,'.base64_encode($svg);
    }
}
