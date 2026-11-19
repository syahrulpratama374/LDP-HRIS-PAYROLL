<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/** Data: alamat lengkap kantor pusat pada layout aktif. Bisa dibalik. */
return new class extends Migration
{
    private const BARU = 'Darmo Residence No. 1, Sonopakis Kidul, Kasihan, Bantul - Yogyakarta';

    private const LAMA = 'Darmo Residence No. 1, Kasihan, Bantul - Yogyakarta';

    public function up(): void
    {
        DB::table('pengaturan_surat_layouts')->where('is_active', true)
            ->update(['alamat' => self::BARU, 'updated_at' => now()]);
    }

    public function down(): void
    {
        DB::table('pengaturan_surat_layouts')->where('alamat', self::BARU)
            ->update(['alamat' => self::LAMA, 'updated_at' => now()]);
    }
};
