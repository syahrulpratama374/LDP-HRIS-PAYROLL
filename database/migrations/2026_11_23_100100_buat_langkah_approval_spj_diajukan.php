<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Data (pengaman B3 -> B4): SPJ yang sudah berstatus 'Diajukan' sebelum alur persetujuan ada
 * belum punya langkah approval. Migrasi ini membuat langkahnya dari rute template SPJ-PD,
 * sehingga SPJ tersebut langsung masuk antrean HC tanpa perlu diajukan ulang.
 * Hanya menyentuh SPJ Diajukan yang belum punya langkah; aman diulang.
 * down(): menghapus langkah yang semuanya masih 'Menunggu' (belum ada yang bertindak).
 */
return new class extends Migration
{
    public function up(): void
    {
        $templateId = DB::table('master_template_surats')->whereRaw('UPPER(kode_surat) = ?', ['SPJ-PD'])->orderBy('id')->value('id');
        $rute = $templateId
            ? DB::table('rute_approval_templates')->where('template_id', $templateId)->orderBy('urutan_langkah')->get()
            : collect();
        if ($rute->isEmpty()) {
            return;
        }

        $spjIds = DB::table('spjs')->where('status', 'Diajukan')
            ->whereNotExists(fn ($q) => $q->from('spj_approvals')->whereColumn('spj_approvals.spj_id', 'spjs.id'))
            ->pluck('id');

        foreach ($spjIds as $spjId) {
            foreach ($rute as $r) {
                DB::table('spj_approvals')->insert([
                    'spj_id' => $spjId, 'urutan_langkah' => $r->urutan_langkah,
                    'tipe_penyetuju' => $r->tipe_penyetuju ?? 'jabatan', 'role_id' => $r->role_id,
                    'jabatan_id' => $r->jabatan_id, 'label_ttd' => $r->label_ttd, 'status' => 'Menunggu',
                    'created_at' => now(), 'updated_at' => now(),
                ]);
            }
        }
    }

    public function down(): void
    {
        $belumDisentuh = DB::table('spj_approvals')->select('spj_id')->groupBy('spj_id')
            ->havingRaw("SUM(CASE WHEN status <> 'Menunggu' THEN 1 ELSE 0 END) = 0")
            ->pluck('spj_id');
        DB::table('spj_approvals')->whereIn('spj_id', $belumDisentuh)->delete();
    }
};
