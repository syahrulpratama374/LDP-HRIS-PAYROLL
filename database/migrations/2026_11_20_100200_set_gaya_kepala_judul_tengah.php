<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Data: jenis surat bergaya "judul tengah" (gaya A). SM dan jenis lain tetap blok_nomor.
 * Kode dibandingkan tanpa membedakan huruf besar/kecil. Bisa dibalik.
 */
return new class extends Migration
{
    private const KODE = [
        'SPJ-PD', 'SK', 'SKEP', 'SKET', 'STU', 'SP', 'SE',
        'PKS', 'PKS-IPR', 'PKS-CUST', 'BA', 'BAKES', 'SPK', 'SPH',
    ];

    public function up(): void
    {
        $this->set('judul_tengah');
    }

    public function down(): void
    {
        $this->set('blok_nomor');
    }

    private function set(string $gaya): void
    {
        $placeholder = implode(',', array_fill(0, count(self::KODE), '?'));
        DB::table('master_template_surats')
            ->whereRaw("UPPER(kode_surat) IN ({$placeholder})", self::KODE)
            ->update(['gaya_kepala' => $gaya, 'updated_at' => now()]);
    }
};
