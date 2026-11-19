<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Data: rute approval template SPJ-PD = HC -> Finance -> Direktur (berapa pun nominalnya).
 *   1. role HC        "Diajukan Oleh"
 *   2. role Finance   "Diperiksa Oleh"
 *   3. jabatan CEO    "Disetujui Oleh"
 * Hanya diisi bila template SPJ-PD ada dan belum punya rute (rute yang sudah diatur HC tidak
 * ditimpa). Di DB baru, MasterTemplateSuratSeeder yang mengisinya. Bisa dibalik.
 */
return new class extends Migration
{
    private const ROLE_HC = 3;

    private const ROLE_FINANCE = 4;

    public function up(): void
    {
        $templateId = DB::table('master_template_surats')->whereRaw('UPPER(kode_surat) = ?', ['SPJ-PD'])->orderBy('id')->value('id');
        $jabatanCeo = DB::table('jabatans')->where('kode_jabatan', 'CEO')->value('id');
        $adaRole = DB::table('roles')->whereIn('id', [self::ROLE_HC, self::ROLE_FINANCE])->count() === 2;

        if (! $templateId || ! $jabatanCeo || ! $adaRole
            || DB::table('rute_approval_templates')->where('template_id', $templateId)->exists()) {
            return;
        }

        $baris = fn (int $urutan, string $tipe, ?int $role, ?int $jabatan, string $label) => [
            'template_id' => $templateId, 'urutan_langkah' => $urutan, 'tipe_penyetuju' => $tipe,
            'role_id' => $role, 'jabatan_id' => $jabatan, 'label_ttd' => $label,
            'created_at' => now(), 'updated_at' => now(),
        ];

        DB::table('rute_approval_templates')->insert([
            $baris(1, 'role', self::ROLE_HC, null, 'Diajukan Oleh'),
            $baris(2, 'role', self::ROLE_FINANCE, null, 'Diperiksa Oleh'),
            $baris(3, 'jabatan', null, $jabatanCeo, 'Disetujui Oleh'),
        ]);
    }

    public function down(): void
    {
        $templateId = DB::table('master_template_surats')->whereRaw('UPPER(kode_surat) = ?', ['SPJ-PD'])->orderBy('id')->value('id');
        if ($templateId) {
            DB::table('rute_approval_templates')->where('template_id', $templateId)
                ->whereIn('label_ttd', ['Diajukan Oleh', 'Diperiksa Oleh', 'Disetujui Oleh'])
                ->delete();
        }
    }
};
