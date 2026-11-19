<?php

namespace App\Support;

/** Angka ke kata Bahasa Indonesia, mis. 1476000 -> "Satu Juta Empat Ratus Tujuh Puluh Enam Ribu Rupiah". */
class Terbilang
{
    private const SATUAN = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas'];

    public static function rupiah(float|int $nilai): string
    {
        $bulat = (int) round($nilai);
        $kata = $bulat === 0 ? 'nol' : self::kata($bulat);

        return ucwords(trim(preg_replace('/\s+/', ' ', $kata))).' Rupiah';
    }

    private static function kata(int $n): string
    {
        return match (true) {
            $n < 0 => 'minus '.self::kata(-$n),
            $n < 12 => self::SATUAN[$n],
            $n < 20 => self::kata($n - 10).' belas',
            $n < 100 => self::kata(intdiv($n, 10)).' puluh '.self::kata($n % 10),
            $n < 200 => 'seratus '.self::kata($n - 100),
            $n < 1000 => self::kata(intdiv($n, 100)).' ratus '.self::kata($n % 100),
            $n < 2000 => 'seribu '.self::kata($n - 1000),
            $n < 1_000_000 => self::kata(intdiv($n, 1000)).' ribu '.self::kata($n % 1000),
            $n < 1_000_000_000 => self::kata(intdiv($n, 1_000_000)).' juta '.self::kata($n % 1_000_000),
            $n < 1_000_000_000_000 => self::kata(intdiv($n, 1_000_000_000)).' miliar '.self::kata($n % 1_000_000_000),
            default => self::kata(intdiv($n, 1_000_000_000_000)).' triliun '.self::kata($n % 1_000_000_000_000),
        };
    }
}
