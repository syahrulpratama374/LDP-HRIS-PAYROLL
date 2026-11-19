<?php

namespace App\Services;

/**
 * Ubah gambar di disk public menjadi data URI untuk DomPDF (tanpa akses HTTP).
 * Sebelumnya berupa fungsi global yang dideklarasikan di dalam Blade, sehingga merender dua PDF
 * dalam satu proses memicu "Cannot redeclare function".
 */
class PdfGambarService
{
    /**
     * @param  bool  $abuAbu  ubah ke grayscale (transparansi dipertahankan); DomPDF tidak mendukung
     *                        CSS filter, jadi dilakukan di PHP dengan GD. Bila GD/format tidak didukung,
     *                        gambar asli yang dipakai.
     * @return string|null data URI, atau null bila path kosong / file tidak ditemukan
     */
    public static function dataUri(?string $path, bool $abuAbu = false): ?string
    {
        $lengkap = self::cariFile($path);
        if (! $lengkap) {
            return null;
        }

        if ($abuAbu && ($png = self::grayscalePng($lengkap))) {
            return 'data:image/png;base64,'.base64_encode($png);
        }

        $mime = mime_content_type($lengkap) ?: 'image/png';

        return "data:{$mime};base64,".base64_encode(file_get_contents($lengkap));
    }

    private static function cariFile(?string $path): ?string
    {
        if (! $path) {
            return null;
        }

        $bersih = ltrim($path, '/');
        foreach ([storage_path('app/public/'.$bersih), public_path('storage/'.$bersih)] as $lengkap) {
            if (is_file($lengkap)) {
                return $lengkap;
            }
        }

        return null;
    }

    private static function grayscalePng(string $lengkap): ?string
    {
        if (! function_exists('imagefilter')) {
            return null;
        }

        // GD bisa dibangun tanpa dukungan JPEG; cek fungsi agar tidak error, pakai gambar asli bila tidak ada
        $gambar = match (mime_content_type($lengkap)) {
            'image/png' => function_exists('imagecreatefrompng') ? @imagecreatefrompng($lengkap) : false,
            'image/jpeg' => function_exists('imagecreatefromjpeg') ? @imagecreatefromjpeg($lengkap) : false,
            default => false,
        };
        if (! $gambar) {
            return null;
        }

        imagealphablending($gambar, false);
        imagesavealpha($gambar, true);
        imagefilter($gambar, IMG_FILTER_GRAYSCALE);

        ob_start();
        imagepng($gambar);

        return ob_get_clean() ?: null;
    }
}
