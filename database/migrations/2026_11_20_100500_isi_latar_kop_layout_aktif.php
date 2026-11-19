<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

/**
 * Data: pasang gambar latar kop resmi ke layout aktif.
 *
 * Sumber: storage/app/kop/kop_latar_ldp_a4.jpg (bila ada di mesin ini), jika tidak ada pakai salinan
 * yang ikut repo di resources/kop/kop_latar_ldp_a4.jpg, sehingga komputer lain yang menjalankan
 * `php artisan migrate` mendapat kop yang sama.
 *
 * Aman diulang: file tujuan hanya ditulis bila belum ada, dan latar_kop_path hanya diisi bila masih
 * kosong, jadi gambar latar yang sudah diganti lewat menu Layout tidak ditimpa.
 * down(): melepas tautan yang dipasang migrasi ini saja (file salinan dibiarkan).
 */
return new class extends Migration
{
    private const TUJUAN = 'persuratan/layout/kop_latar_ldp_a4.jpg';

    public function up(): void
    {
        $sumber = collect([
            storage_path('app/kop/kop_latar_ldp_a4.jpg'),
            resource_path('kop/kop_latar_ldp_a4.jpg'),
        ])->first(fn ($p) => is_file($p));

        if (! $sumber) {
            return;
        }

        $disk = Storage::disk('public');
        if (! $disk->exists(self::TUJUAN)) {
            $disk->put(self::TUJUAN, file_get_contents($sumber));
        }

        DB::table('pengaturan_surat_layouts')->where('is_active', true)
            ->whereNull('latar_kop_path')
            ->update(['latar_kop_path' => self::TUJUAN, 'updated_at' => now()]);
    }

    public function down(): void
    {
        DB::table('pengaturan_surat_layouts')->where('latar_kop_path', self::TUJUAN)
            ->update(['latar_kop_path' => null, 'updated_at' => now()]);
    }
};
