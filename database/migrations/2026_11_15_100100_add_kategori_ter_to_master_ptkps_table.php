<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('master_ptkps', function (Blueprint $table) {
            $table->char('kategori_ter', 1)->nullable()->after('nominal_neto_tahunan');
        });

        // Pemetaan kategori TER menurut PMK 168/2023
        $peta = [
            'A' => ['TK/0', 'TK/1'],
            'B' => ['TK/2', 'TK/3', 'K/0', 'K/1'],
            'C' => ['K/2', 'K/3'],
        ];
        foreach ($peta as $kategori => $kodes) {
            DB::table('master_ptkps')->whereIn('kode_ptkp', $kodes)->update(['kategori_ter' => $kategori]);
        }
    }

    public function down(): void
    {
        Schema::table('master_ptkps', function (Blueprint $table) {
            $table->dropColumn('kategori_ter');
        });
    }
};
