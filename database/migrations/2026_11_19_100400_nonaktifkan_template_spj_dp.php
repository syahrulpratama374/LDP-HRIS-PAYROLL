<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Nonaktifkan template uji lama id 3 (kode "spj-dp"), digantikan jenis SPJ-PD.
 * Tidak dihapus karena surat #2 (001/spj-dp/ldp-hc/XI/2026) memakainya.
 * Dicocokkan id + kode agar tidak menyentuh baris lain di DB yang berbeda.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::table('master_template_surats')
            ->where('id', 3)
            ->where('kode_surat', 'spj-dp')
            ->update(['is_active' => false, 'updated_at' => now()]);
    }

    public function down(): void
    {
        DB::table('master_template_surats')
            ->where('id', 3)
            ->where('kode_surat', 'spj-dp')
            ->update(['is_active' => true, 'updated_at' => now()]);
    }
};
