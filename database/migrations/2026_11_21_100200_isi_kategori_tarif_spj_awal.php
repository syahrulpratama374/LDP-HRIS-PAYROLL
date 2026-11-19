<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Data: nilai awal kategori tarif SPJ (dijalankan sekali, saat kolom baru masih default Staff).
 * - kode jabatan CEO / MD -> Direksi
 * - kode jabatan MGR      -> Manager
 * - selain itu            -> Staff (default kolom)
 * Pengecualian struktur LDP 2026: posisi "Head"/officer berjenjang MGR tetap Staff.
 * Setelah ini HC mengubah per orang lewat menu Master Tarif SPJ.
 */
return new class extends Migration
{
    /** username => alasan */
    private const PENGECUALIAN_STAFF = [
        'fahla' => 'Head of Artistic - Creative Team',
        'mikha' => 'Head of Sales & IPrime',
        'elvira' => 'Business Relation Officer',
    ];

    public function up(): void
    {
        $jabatan = fn (array $kode) => DB::table('jabatans')->whereIn('kode_jabatan', $kode)->pluck('id');

        DB::table('karyawans')->whereIn('jabatan_id', $jabatan(['CEO', 'MD']))
            ->update(['kategori_tarif_spj' => 'Direksi']);
        DB::table('karyawans')->whereIn('jabatan_id', $jabatan(['MGR']))
            ->update(['kategori_tarif_spj' => 'Manager']);

        $userIds = DB::table('users')->whereIn('username', array_keys(self::PENGECUALIAN_STAFF))->pluck('id');
        DB::table('karyawans')->whereIn('user_id', $userIds)->update(['kategori_tarif_spj' => 'Staff']);
    }

    public function down(): void
    {
        DB::table('karyawans')->update(['kategori_tarif_spj' => 'Staff']);
    }
};
