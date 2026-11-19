<?php

namespace App\Services;

use App\Models\NomorSuratTerbit;
use App\Models\Pengaturan;
use App\Models\PenomoranSurat;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use InvalidArgumentException;

/**
 * Pintu tunggal penerbitan nomor surat resmi, dipakai semua modul (Surat Keluar, SPJ, dst.).
 *
 * Format: {urut 3 digit}/{KODE_JENIS}/{KODE_PENERBIT}/{BULAN_ROMAWI}/{TAHUN}, semua huruf besar.
 * Bulan & tahun diambil dari waktu terbit. Nomor urut direset tiap tahun; cakupan urutan
 * diatur pengaturan `penomoran_surat_mode`: global | per_jenis | per_penerbit.
 */
class PenomoranSuratService
{
    public const KUNCI_MODE = 'penomoran_surat_mode';

    public const MODE_GLOBAL = 'global';

    public const MODE_PER_JENIS = 'per_jenis';

    public const MODE_PER_PENERBIT = 'per_penerbit';

    public const MODES = [self::MODE_GLOBAL, self::MODE_PER_JENIS, self::MODE_PER_PENERBIT];

    /** Penerbit cadangan, hanya untuk draf lama yang belum punya penerbit saat terbit. */
    public const PENERBIT_FALLBACK = 'LDP-CORP';

    private const ROMAWI = [1 => 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

    /**
     * Terbitkan satu nomor surat resmi dan catat di register.
     *
     * Panggil DI DALAM transaksi pemanggil (yang juga menyimpan dokumennya), supaya kunci baris
     * penghitung dipegang sampai commit dan nomor batal bila dokumen gagal disimpan. Bila
     * dipanggil di luar transaksi, method ini membuka transaksinya sendiri.
     *
     * @param  string  $kodeJenis  kode jenis surat, mis. "SKET", "SPJ-PD"
     * @param  string  $kodePenerbit  kode unit penerbit, mis. "LDP-HC"
     * @param  CarbonInterface|null  $waktu  waktu terbit (default now()); menentukan bulan & tahun
     * @param  Model|null  $sumber  dokumen pemilik nomor (dicatat polimorfik di register)
     * @return string nomor resmi, mis. "007/SKET/LDP-HC/XI/2026"
     */
    public function terbitkan(string $kodeJenis, string $kodePenerbit, ?CarbonInterface $waktu = null, ?Model $sumber = null): string
    {
        $jenis = $this->normalisasiKode($kodeJenis, 'jenis surat');
        $penerbit = $this->normalisasiKode($kodePenerbit, 'penerbit');
        $waktu ??= now();

        return DB::transaction(function () use ($jenis, $penerbit, $waktu, $sumber) {
            $mode = $this->mode();
            $tahun = (int) $waktu->year;
            $penghitung = $this->kunciPenghitung($this->kunciUrutan($mode, $tahun, $jenis, $penerbit));

            // max(): tetap aman bila mode pernah diganti (penghitung kunci baru mulai dari nomor yang sudah terbit)
            $urut = max($penghitung->nomor_terakhir, $this->urutTerbesarTerdaftar($mode, $tahun, $jenis, $penerbit));
            do {
                $nomor = $this->formatNomor(++$urut, $jenis, $penerbit, $waktu);
            } while (NomorSuratTerbit::where('nomor', $nomor)->exists());

            $penghitung->update(['nomor_terakhir' => $urut]);

            NomorSuratTerbit::create([
                'nomor' => $nomor,
                'tahun' => $tahun,
                'urut' => $urut,
                'kode_jenis' => $jenis,
                'kode_penerbit' => $penerbit,
                'sumber_type' => $sumber?->getMorphClass(),
                'sumber_id' => $sumber?->getKey(),
                'diterbitkan_pada' => $waktu,
            ]);

            return $nomor;
        });
    }

    /** Mode urutan aktif dari tabel pengaturans; nilai tidak dikenal => global (dicatat di log). */
    public function mode(): string
    {
        $mode = trim(Pengaturan::teks(self::KUNCI_MODE, self::MODE_GLOBAL));
        if (! in_array($mode, self::MODES, true)) {
            Log::warning('Pengaturan '.self::KUNCI_MODE." bernilai '{$mode}' tidak dikenal; memakai 'global'.");

            return self::MODE_GLOBAL;
        }

        return $mode;
    }

    /** Kunci baris penghitung untuk mode tertentu. */
    public function kunciUrutan(string $mode, int $tahun, string $kodeJenis, string $kodePenerbit): string
    {
        return match ($mode) {
            self::MODE_PER_JENIS => "{$tahun}|".strtoupper($kodeJenis),
            self::MODE_PER_PENERBIT => "{$tahun}|".strtoupper($kodePenerbit),
            default => (string) $tahun,
        };
    }

    public function formatNomor(int $urut, string $kodeJenis, string $kodePenerbit, CarbonInterface $waktu): string
    {
        return sprintf('%03d/%s/%s/%s/%d',
            $urut, strtoupper($kodeJenis), strtoupper($kodePenerbit), self::romawi((int) $waktu->month), $waktu->year);
    }

    public static function romawi(int $bulan): string
    {
        return self::ROMAWI[$bulan] ?? throw new InvalidArgumentException("Bulan tidak valid: {$bulan}");
    }

    /** Huruf besar + validasi: hanya huruf, angka, dan '-' (tanpa '/', yang merusak format nomor). */
    public function normalisasiKode(string $kode, string $label = 'kode'): string
    {
        $kode = strtoupper(trim($kode));
        if (! preg_match('/^[A-Z0-9-]+$/', $kode)) {
            throw new InvalidArgumentException("Kode {$label} '{$kode}' tidak valid untuk penomoran surat.");
        }

        return $kode;
    }

    /**
     * Ambil & kunci (SELECT ... FOR UPDATE) baris penghitung; buat dulu bila belum ada.
     * insertOrIgnore didahului baca biasa supaya baris yang sudah ada tidak terkena kunci
     * bersama (shared lock) yang bisa memicu deadlock.
     */
    private function kunciPenghitung(string $kunci): PenomoranSurat
    {
        if (! PenomoranSurat::where('kunci', $kunci)->exists()) {
            PenomoranSurat::insertOrIgnore([
                'kunci' => $kunci, 'nomor_terakhir' => 0,
                'created_at' => now(), 'updated_at' => now(),
            ]);
        }

        return PenomoranSurat::where('kunci', $kunci)->lockForUpdate()->firstOrFail();
    }

    /** Nomor urut terbesar yang sudah terbit dalam cakupan mode aktif (lintas modul). */
    private function urutTerbesarTerdaftar(string $mode, int $tahun, string $jenis, string $penerbit): int
    {
        $q = NomorSuratTerbit::where('tahun', $tahun);
        if ($mode === self::MODE_PER_JENIS) {
            $q->where('kode_jenis', $jenis);
        } elseif ($mode === self::MODE_PER_PENERBIT) {
            $q->where('kode_penerbit', $penerbit);
        }

        return (int) $q->max('urut');
    }
}
