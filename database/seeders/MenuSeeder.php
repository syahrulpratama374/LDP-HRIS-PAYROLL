<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Role;
use Illuminate\Support\Facades\DB;

class MenuSeeder extends Seeder
{
    public function run(): void
    {
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        DB::table('role_has_menus')->truncate();
        DB::table('menus')->truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        // 1. MENU UTAMA / PARENT
        $dashboard = DB::table('menus')->insertGetId([
            'parent_id' => null, 'title' => 'Dashboard', 'route_name' => 'dashboard', 'order' => 1, 'created_at' => now(), 'updated_at' => now()
        ]);

        $absensi = DB::table('menus')->insertGetId([
            'parent_id' => null, 'title' => 'Absensi', 'route_name' => 'absensi.create', 'order' => 2, 'created_at' => now(), 'updated_at' => now()
        ]);

        // 2. PARENT: PENGAJUAN SAYA
        $pengajuanGroup = DB::table('menus')->insertGetId([
            'parent_id' => null, 'title' => 'Pengajuan Saya', 'route_name' => null, 'order' => 3, 'created_at' => now(), 'updated_at' => now()
        ]);
        $subPengajuan = [
            ['parent_id' => $pengajuanGroup, 'title' => 'Pengajuan Cuti', 'route_name' => 'cuti.index', 'order' => 1],
            ['parent_id' => $pengajuanGroup, 'title' => 'Pengajuan Lembur', 'route_name' => 'lembur.index', 'order' => 2],
            ['parent_id' => $pengajuanGroup, 'title' => 'Perjalanan Dinas (SPJ)', 'route_name' => 'spj.index', 'order' => 3],
            ['parent_id' => $pengajuanGroup, 'title' => 'Kasbon & Pinjaman', 'route_name' => 'pinjaman.index', 'order' => 4],
            ['parent_id' => $pengajuanGroup, 'title' => 'Logbook Shift NOC', 'route_name' => 'logbook.index', 'order' => 5],
            ['parent_id' => $pengajuanGroup, 'title' => 'IT Helpdesk', 'route_name' => 'ticket.index', 'order' => 6],
        ];
        foreach ($subPengajuan as $m) DB::table('menus')->insert(array_merge($m, ['created_at' => now(), 'updated_at' => now()]));

        // 3. PARENT: E-PERSURATAN
        $persuratanGroup = DB::table('menus')->insertGetId([
            'parent_id' => null, 'title' => 'e-Persuratan', 'route_name' => null, 'order' => 4, 'created_at' => now(), 'updated_at' => now()
        ]);
        $subPersuratan = [
            ['parent_id' => $persuratanGroup, 'title' => 'Surat Keluar', 'route_name' => 'keluar.index', 'order' => 1],
            ['parent_id' => $persuratanGroup, 'title' => 'Master Template & Rute', 'route_name' => 'template.index', 'order' => 2],
            ['parent_id' => $persuratanGroup, 'title' => 'Layout Kop & Visual', 'route_name' => 'layout.index', 'order' => 3],
        ];
        foreach ($subPersuratan as $m) DB::table('menus')->insert(array_merge($m, ['created_at' => now(), 'updated_at' => now()]));

        // 4. PARENT: APPROVAL CENTER
        $approvalGroup = DB::table('menus')->insertGetId([
            'parent_id' => null, 'title' => 'Approval Center', 'route_name' => null, 'order' => 5, 'created_at' => now(), 'updated_at' => now()
        ]);
        $subApproval = [
            ['parent_id' => $approvalGroup, 'title' => 'Approval Cuti', 'route_name' => 'admin.cuti.index', 'order' => 1],
            ['parent_id' => $approvalGroup, 'title' => 'Approval Lembur', 'route_name' => 'admin.lembur.index', 'order' => 2],
            ['parent_id' => $approvalGroup, 'title' => 'Approval SPJ', 'route_name' => 'admin.spj.index', 'order' => 3],
            ['parent_id' => $approvalGroup, 'title' => 'Delegasi Wewenang (Plt)', 'route_name' => 'admin.delegasi.index', 'order' => 4],
            ['parent_id' => $approvalGroup, 'title' => 'Penilaian KPI Kinerja', 'route_name' => 'admin.kinerja.index', 'order' => 5],
        ];
        foreach ($subApproval as $m) DB::table('menus')->insert(array_merge($m, ['created_at' => now(), 'updated_at' => now()]));

        // 5. PARENT: KEPEGAWAIAN & MASTER DATA
        $kepegawaianGroup = DB::table('menus')->insertGetId([
            'parent_id' => null, 'title' => 'Kepegawaian', 'route_name' => null, 'order' => 6, 'created_at' => now(), 'updated_at' => now()
        ]);
        $subKepegawaian = [
            ['parent_id' => $kepegawaianGroup, 'title' => 'Data Karyawan', 'route_name' => 'karyawan.index', 'order' => 1],
            ['parent_id' => $kepegawaianGroup, 'title' => 'Monitor Absensi', 'route_name' => 'absensi.index', 'order' => 2],
            ['parent_id' => $kepegawaianGroup, 'title' => 'Broadcast Internal', 'route_name' => 'pengumuman.index', 'order' => 3],
        ];
        foreach ($subKepegawaian as $m) DB::table('menus')->insert(array_merge($m, ['created_at' => now(), 'updated_at' => now()]));

        // Inisialisasi $masterDataGroup DULU sebelum dipakai di bawahnya!
        $masterDataGroup = DB::table('menus')->insertGetId([
            'parent_id' => null, 'title' => 'Master Data', 'route_name' => null, 'order' => 7, 'created_at' => now(), 'updated_at' => now()
        ]);
        
        $subMaster = [
            ['parent_id' => $masterDataGroup, 'title' => 'Departemen', 'route_name' => 'departemen.index', 'order' => 1],
            ['parent_id' => $masterDataGroup, 'title' => 'Jabatan', 'route_name' => 'jabatan.index', 'order' => 2],
            ['parent_id' => $masterDataGroup, 'title' => 'Golongan', 'route_name' => 'golongan.index', 'order' => 3],
            ['parent_id' => $masterDataGroup, 'title' => 'Jam Shift', 'route_name' => 'shift.index', 'order' => 4],
            // TARUH DI SINI (Di dalam $subMaster setelah $masterDataGroup didefinisikan):
            ['parent_id' => $masterDataGroup, 'title' => 'Master Jenis Cuti', 'route_name' => 'master-cuti.index', 'order' => 5],
        ];
        foreach ($subMaster as $m) DB::table('menus')->insert(array_merge($m, ['created_at' => now(), 'updated_at' => now()]));


        // 6. PARENT: FINANCE & PAYROLL
        $financeGroup = DB::table('menus')->insertGetId([
            'parent_id' => null, 'title' => 'Finance & Payroll', 'route_name' => null, 'order' => 8, 'created_at' => now(), 'updated_at' => now()
        ]);
        $subFinance = [
            ['parent_id' => $financeGroup, 'title' => 'Approval Kasbon', 'route_name' => 'admin.pinjaman.index', 'order' => 1],
            ['parent_id' => $financeGroup, 'title' => 'Kalkulator Payroll', 'route_name' => 'admin.payroll.index', 'order' => 2],
            ['parent_id' => $financeGroup, 'title' => 'Master Komponen Gaji', 'route_name' => 'admin.komponen.index', 'order' => 3],
        ];
        foreach ($subFinance as $m) DB::table('menus')->insert(array_merge($m, ['created_at' => now(), 'updated_at' => now()]));

        // 7. PARENT: SISTEM & ASET
        $sistemGroup = DB::table('menus')->insertGetId([
            'parent_id' => null, 'title' => 'Sistem & Aset', 'route_name' => null, 'order' => 9, 'created_at' => now(), 'updated_at' => now()
        ]);
        $subSistem = [
            ['parent_id' => $sistemGroup, 'title' => 'Aset & QR Code', 'route_name' => 'admin.aset.index', 'order' => 1],
            ['parent_id' => $sistemGroup, 'title' => 'Audit Trail (Log Forensik)', 'route_name' => 'admin.audit.index', 'order' => 2],
            ['parent_id' => $sistemGroup, 'title' => 'Pengaturan Hak Akses', 'route_name' => 'admin.role.index', 'order' => 3],
            ['parent_id' => $sistemGroup, 'title' => 'Pengaturan Parameter Sistem', 'route_name' => 'admin.pengaturan.index', 'order' => 4],

            ['parent_id' => $sistemGroup, 'title' => 'Monitoring IT Ticket', 'route_name' => 'admin.ticket.index', 'order' => 5],
        ];
        foreach ($subSistem as $m) DB::table('menus')->insert(array_merge($m, ['created_at' => now(), 'updated_at' => now()]));

        // MEMBERIKAN SELURUH HAK AKSES MENU KEPADA SUPER ADMIN (ROLE ID 1)
        $allMenuIds = DB::table('menus')->pluck('id');
        foreach ($allMenuIds as $menuId) {
            DB::table('role_has_menus')->insert([
                'role_id' => 1,
                'menu_id' => $menuId,
                'created_at' => now(),
                'updated_at' => now()
            ]);
        }
    }
}