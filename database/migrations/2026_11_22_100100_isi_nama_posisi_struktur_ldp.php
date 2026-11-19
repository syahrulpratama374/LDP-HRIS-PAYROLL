<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Data: nama_posisi dari bagan Struktur Organisasi LDP 2026 (salinan dari LdpStrukturSeeder agar
 * migrasi tidak bergantung pada seeder). Hanya mengisi yang masih kosong, sehingga koreksi HC tidak
 * tertimpa. down() hanya mengosongkan nilai yang masih sama persis dengan bagan.
 */
return new class extends Migration
{
    /** username => judul posisi */
    private const POSISI = [
        'ceo' => 'Chief Executive Officer',
        'md' => 'Managing Director',
        'fahla' => 'Head of Artistic - Creative Team',
        'staff.cre1' => 'Staff Pelaksana',
        'mikha' => 'Head of Sales & IPrime',
        'staff.iprime1' => 'Staff Pelaksana',
        'sulistyanto' => 'Manager Sales & Marketing',
        'staff.sls1' => 'Staff Pelaksana',
        'yoga' => 'Manager HC',
        'hakim' => 'SPV HC',
        'staff.hc1' => 'Staff Pelaksana',
        'yanis' => 'Manager Government & Partnership',
        'staff.gov1' => 'Staff Pelaksana',
        'muslih' => 'Manager Finance',
        'anas' => 'Head of Accounting',
        'staff.fin1' => 'Staff Pelaksana',
        'nanang' => 'Manager OPM',
        'puji' => 'SPV NOC Global',
        'syahrul' => 'Staff NOC Global 1',
        'staff.noc2' => 'Staff Pelaksana',
        'septian' => 'SPV POP Yogya',
        'staff.pop1' => 'Staff Pelaksana',
        'staff.pop2' => 'Staff Pelaksana',
        'bambang' => 'SPV CS ME DC',
        'staff.cs1' => 'Staff Pelaksana',
        'staff.cs2' => 'Staff Pelaksana',
        'ridwan' => 'Manager of Infra & Backbone',
        'bagusdwi' => 'Wk. OPM Manager',
        'staff.wkopm1' => 'Staff Pelaksana',
        'abi' => 'SPV Backbone',
        'staff.bb1' => 'Staff Pelaksana',
        'puguh' => 'SPV Distribution',
        'staff.dist1' => 'Staff Pelaksana',
        'elvira' => 'Business Relation Officer',
        'staff.bro1' => 'Staff Pelaksana',
    ];

    public function up(): void
    {
        foreach (self::POSISI as $username => $posisi) {
            $userId = DB::table('users')->where('username', $username)->value('id');
            if ($userId) {
                DB::table('karyawans')->where('user_id', $userId)
                    ->where(fn ($q) => $q->whereNull('nama_posisi')->orWhere('nama_posisi', ''))
                    ->update(['nama_posisi' => $posisi]);
            }
        }
    }

    public function down(): void
    {
        foreach (self::POSISI as $username => $posisi) {
            $userId = DB::table('users')->where('username', $username)->value('id');
            if ($userId) {
                DB::table('karyawans')->where('user_id', $userId)->where('nama_posisi', $posisi)
                    ->update(['nama_posisi' => null]);
            }
        }
    }
};
