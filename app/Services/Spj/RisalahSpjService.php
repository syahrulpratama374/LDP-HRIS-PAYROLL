<?php

namespace App\Services\Spj;

use App\Models\Karyawan;
use App\Models\PengaturanSuratLayout;
use App\Models\Spj;
use App\Models\SpjRisalah;
use App\Models\SpjRisalahDetail;
use App\Models\User;
use App\Services\PdfGambarService;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Koordinator & Risalah Perjalanan Dinas:
 * - Koordinator dipilih dari peserta; diubah oleh pengaju atau HC selama SPJ belum Selesai/Dibatalkan.
 * - Risalah diisi SETELAH perjalanan dimulai (SPJ Disetujui & hari ini >= tanggal berangkat) oleh
 *   koordinator atau pengaju: topik, tempat, waktu, kegiatan per tanggal, lampiran gambar per tanggal.
 * - PDF risalah meniru dokumen perusahaan (latar kop A4, Carlito), tanda tangan koordinator (atau pengaju).
 */
class RisalahSpjService
{
    /** Kotak maksimum gambar lampiran di PDF (cm): lebar area isi latar kop dan tinggi wajar per gambar. */
    private const GAMBAR_MAKS_LEBAR_CM = 16.0;

    private const GAMBAR_MAKS_TINGGI_CM = 10.5;

    /** Foto dengan sisi terpanjang melebihi ini diperkecil saat unggah agar PDF tidak membengkak. */
    private const GAMBAR_MAKS_PX = 1600;

    public function bolehUbahKoordinator(User $user, Spj $spj): bool
    {
        return ! in_array($spj->status, [Spj::STATUS_SELESAI, Spj::STATUS_DIBATALKAN], true)
            && ((int) $spj->dibuat_oleh === (int) $user->id || (int) $user->role_id === 3);
    }

    public function adalahKoordinator(User $user, Spj $spj): bool
    {
        return $spj->koordinator_karyawan_id !== null && $user->karyawan?->id !== null
            && (int) $spj->koordinator_karyawan_id === (int) $user->karyawan->id;
    }

    /** Alasan risalah belum bisa diisi oleh $user, atau null bila boleh. */
    public function alasanTidakBisaIsi(User $user, Spj $spj): ?string
    {
        if ((int) $spj->dibuat_oleh !== (int) $user->id && ! $this->adalahKoordinator($user, $spj)) {
            return 'Risalah hanya dapat diisi oleh koordinator atau pengaju SPJ.';
        }
        if ($spj->status !== Spj::STATUS_DISETUJUI) {
            return "Risalah hanya dapat diisi untuk SPJ berstatus Disetujui (sekarang {$spj->status}).";
        }
        if (now()->toDateString() < Carbon::parse($spj->tgl_berangkat)->toDateString()) {
            return 'Risalah diisi setelah perjalanan dimulai (mulai '
                .Carbon::parse($spj->tgl_berangkat)->locale('id')->translatedFormat('d F Y').').';
        }

        return null;
    }

    public function bolehIsi(User $user, Spj $spj): bool
    {
        return $this->alasanTidakBisaIsi($user, $spj) === null;
    }

    /** Tanggal perjalanan (Y-m-d), satu blok risalah per tanggal. */
    public function tanggalPerjalanan(Spj $spj): array
    {
        return collect(CarbonPeriod::create(Carbon::parse($spj->tgl_berangkat), Carbon::parse($spj->tgl_pulang)))
            ->map(fn (Carbon $t) => $t->toDateString())->all();
    }

    public function risalahTerisi(Spj $spj): bool
    {
        $r = $spj->risalah()->with('details')->first();

        return $r !== null && $r->terisi();
    }

    /**
     * Simpan kepala risalah & kegiatan per tanggal. $kegiatan: [Y-m-d => [teks, ...]].
     * Tanggal di luar perjalanan diabaikan; kegiatan kosong dibuang.
     */
    public function simpan(Spj $spj, User $oleh, array $kepala, array $kegiatan): SpjRisalah
    {
        return DB::transaction(function () use ($spj, $oleh, $kepala, $kegiatan) {
            $risalah = SpjRisalah::updateOrCreate(['spj_id' => $spj->id], [
                'topik' => trim($kepala['topik']),
                'tempat' => trim($kepala['tempat']),
                'waktu' => trim($kepala['waktu']),
                'diisi_oleh' => $oleh->id,
            ]);
            foreach ($this->tanggalPerjalanan($spj) as $tgl) {
                $daftar = collect($kegiatan[$tgl] ?? [])->map(fn ($k) => trim((string) $k))->filter()->values()->all();
                $risalah->details()->updateOrCreate(['tanggal' => $tgl], ['kegiatan' => $daftar]);
            }

            return $risalah->fresh('details');
        });
    }

    /** Detail untuk satu tanggal (risalah dibuat kosong bila belum ada) — dipakai saat unggah lampiran. */
    public function detailUntuk(Spj $spj, string $tanggal, User $oleh): SpjRisalahDetail
    {
        $risalah = SpjRisalah::firstOrCreate(['spj_id' => $spj->id], ['diisi_oleh' => $oleh->id]);

        return $risalah->details()->firstOrCreate(['tanggal' => $tanggal], ['kegiatan' => []]);
    }

    /** Penanda tangan risalah: koordinator, bila kosong karyawan pengaju. */
    public function penandaTangan(Spj $spj): ?Karyawan
    {
        $id = $spj->koordinator_karyawan_id ?? $spj->pembuat?->karyawan?->id;

        return $id ? Karyawan::with('jabatan')->find($id) : null;
    }

    public function namaPdf(Spj $spj): string
    {
        return 'Risalah_'.str_replace(['/', '\\'], '_', (string) ($spj->nomor_surat ?? $spj->id)).'.pdf';
    }

    public function buatPdf(Spj $spj): \Barryvdh\DomPDF\PDF
    {
        return Pdf::loadView('pdf.spj_risalah', $this->dataPdf($spj))->setPaper('a4', 'portrait');
    }

    /** Data view pdf.spj_risalah. */
    public function dataPdf(Spj $spj): array
    {
        $spj->loadMissing(['pesertas', 'pembuat.karyawan', 'risalah.details.lampirans']);
        $layout = PengaturanSuratLayout::where('is_active', true)->first();
        $risalah = $spj->risalah;
        $berangkat = Carbon::parse($spj->tgl_berangkat)->locale('id');
        $pulang = Carbon::parse($spj->tgl_pulang)->locale('id');
        $ttd = $this->penandaTangan($spj);

        $details = collect($this->tanggalPerjalanan($spj))->map(function (string $tgl) use ($risalah) {
            $d = $risalah?->details->first(fn ($x) => Carbon::parse($x->tanggal)->toDateString() === $tgl);

            return [
                'judul' => Carbon::parse($tgl)->locale('id')->translatedFormat('l, d F Y'),
                'kegiatan' => $d?->kegiatan ?? [],
                'gambar' => $d ? $d->lampirans->map(fn ($l) => $this->gambarMuat($l->path))->filter()->values()->all() : [],
            ];
        })->all();

        return [
            'spj' => $spj,
            'layout' => $layout,
            'latarSrc' => PdfGambarService::dataUri($layout->latar_kop_path ?? null),
            'logoSrc' => PdfGambarService::dataUri($layout->logo_header_path ?? null),
            'namaPerusahaan' => $layout->nama_perusahaan ?? 'PT. LINTAS DATA PRIMA',
            'nomor' => $spj->nomor_surat,
            'tanggalPerjalanan' => $berangkat->isSameDay($pulang)
                ? $berangkat->translatedFormat('d F Y')
                : $berangkat->translatedFormat('d F Y').' - '.$pulang->translatedFormat('d F Y'),
            'waktu' => $risalah?->waktu,
            'tempat' => $risalah?->tempat,
            'topik' => $risalah?->topik,
            'peserta' => $spj->pesertas->map(fn ($p) => ['nama' => $p->nama, 'posisi' => $p->posisi])->all(),
            'details' => $details,
            'penandaTangan' => [
                'label' => $spj->koordinator_karyawan_id ? 'Koordinator Perjalanan Dinas' : 'Pengaju',
                'nama' => $ttd?->nama_lengkap ?? ($spj->pembuat?->name ?? '-'),
                'posisi' => $ttd ? ($ttd->nama_posisi ?: ($ttd->jabatan->nama_jabatan ?? '')) : '',
            ],
        ];
    }

    /**
     * Simpan gambar lampiran ke disk privat. Foto dengan sisi terpanjang > GAMBAR_MAKS_PX diperkecil SAAT UNGGAH
     * (PNG dan JPEG; JPEG hanya bila GD mendukung JPEG), dan orientasi EXIF foto ponsel diluruskan, agar render PDF
     * ringan dan gambar tidak terbalik. Bila GD tidak mendukung formatnya, berkas asli disimpan apa adanya.
     */
    public function simpanGambar(\Illuminate\Http\UploadedFile $file, Spj $spj): string
    {
        $hasil = $this->olahGambar($file->getRealPath());
        if ($hasil !== null) {
            [$biner, $ekstensi] = $hasil;
            $path = "spj/risalah/{$spj->id}/".Str::random(40).'.'.$ekstensi;
            Storage::disk('local')->put($path, $biner);

            return $path;
        }

        return $file->store("spj/risalah/{$spj->id}", 'local');
    }

    /**
     * Perkecil (sisi terpanjang <= GAMBAR_MAKS_PX, rasio tetap) dan luruskan orientasi EXIF.
     *
     * @return array{0: string, 1: string}|null [biner, ekstensi]; null bila tidak perlu diolah atau GD tidak mendukung
     */
    private function olahGambar(string $lengkap): ?array
    {
        $info = @getimagesize($lengkap);
        $mime = $info['mime'] ?? null;
        if (! $info || ! in_array($mime, ['image/png', 'image/jpeg'], true)) {
            return null;
        }
        $png = $mime === 'image/png';
        if (! function_exists($png ? 'imagecreatefrompng' : 'imagecreatefromjpeg')) {
            return null; // mis. GD tanpa dukungan JPEG
        }

        $orientasi = 1;
        if (! $png && function_exists('exif_read_data')) {
            $orientasi = (int) (@exif_read_data($lengkap)['Orientation'] ?? 1);
        }
        $besar = max($info[0], $info[1]) > self::GAMBAR_MAKS_PX;
        if (! $besar && $orientasi === 1) {
            return null;
        }

        $img = $png ? @imagecreatefrompng($lengkap) : @imagecreatefromjpeg($lengkap);
        if (! $img) {
            return null;
        }
        // Orientasi EXIF: 3 = 180°, 6 = 90° searah jarum jam, 8 = 90° berlawanan
        $sudut = [3 => 180, 6 => -90, 8 => 90][$orientasi] ?? 0;
        if ($sudut !== 0) {
            $putar = imagerotate($img, $sudut, 0);
            imagedestroy($img);
            $img = $putar;
        }
        $w = imagesx($img);
        $h = imagesy($img);
        if (max($w, $h) > self::GAMBAR_MAKS_PX) {
            $skala = self::GAMBAR_MAKS_PX / max($w, $h);
            $kecil = imagescale($img, max(1, (int) round($w * $skala)), max(1, (int) round($h * $skala)));
            imagedestroy($img);
            $img = $kecil;
        }
        if (! $img) {
            return null;
        }

        ob_start();
        if ($png) {
            imagesavealpha($img, true);
            imagepng($img, null, 6);
        } else {
            imagejpeg($img, null, 85);
        }
        imagedestroy($img);
        $biner = ob_get_clean();

        return $biner ? [$biner, $png ? 'png' : 'jpg'] : null;
    }

    /**
     * Gambar lampiran (disk privat) sebagai data URI + ukuran tampil (cm) yang muat di kotak maksimum,
     * dengan rasio asli (ukuran tampil dihitung dari dimensi asli, tidak butuh GD).
     *
     * @return array{src: string, lebar: float, tinggi: float}|null
     */
    public function gambarMuat(string $path): ?array
    {
        $disk = Storage::disk('local');
        if (! $disk->exists($path)) {
            return null;
        }
        $lengkap = $disk->path($path);
        $info = @getimagesize($lengkap);
        if (! $info || $info[0] <= 0 || $info[1] <= 0) {
            return null;
        }
        [$w, $h] = $info;
        $mime = $info['mime'] ?? 'image/png';
        // Berkas sudah diolah saat unggah (simpanGambar); dibaca apa adanya
        $biner = file_get_contents($lengkap);

        // Skala 1 px = 0,0265 cm (96 dpi), lalu perkecil agar muat kotak maksimum
        $lebar = $w * 0.0265;
        $tinggi = $h * 0.0265;
        $skala = min(1.0, self::GAMBAR_MAKS_LEBAR_CM / $lebar, self::GAMBAR_MAKS_TINGGI_CM / $tinggi);

        return [
            'src' => "data:{$mime};base64,".base64_encode($biner),
            'lebar' => round($lebar * $skala, 2),
            'tinggi' => round($tinggi * $skala, 2),
        ];
    }
}
