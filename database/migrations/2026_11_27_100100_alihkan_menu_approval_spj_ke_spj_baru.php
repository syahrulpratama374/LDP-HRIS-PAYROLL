<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Data: menu "Approval SPJ" di Approval Center diarahkan ke daftar SPJ baru dengan filter "Menunggu Anda"
 * (route spj.menunggu), untuk role yang sebelumnya punya menu approval SPJ lama. Menu lama (admin.spj.index)
 * diganti nama menjadi "Arsip Approval SPJ (Lama)" agar SPJ lama tetap bisa dibaca.
 * Tabel menus/role_has_menus tidak punya indeks unik, jadi keberadaan baris dicek dulu (aman diulang);
 * insertOrIgnore dipakai untuk penyisipan. Di DB baru (menu belum di-seed) tidak melakukan apa pun; MenuSeeder
 * yang menangani.
 */
return new class extends Migration
{
    private const ROUTE_BARU = 'spj.menunggu';

    private const ROUTE_LAMA = 'admin.spj.index';

    private const JUDUL_LAMA = 'Approval SPJ';

    private const JUDUL_ARSIP = 'Arsip Approval SPJ (Lama)';

    public function up(): void
    {
        $grup = DB::table('menus')->whereNull('parent_id')->where('title', 'Approval Center')->value('id');
        if (! $grup) {
            return;
        }
        $lama = DB::table('menus')->where('route_name', self::ROUTE_LAMA)->first();
        $urutan = $lama->order ?? 3;

        if (! DB::table('menus')->where('route_name', self::ROUTE_BARU)->exists()) {
            DB::table('menus')->insertOrIgnore([
                'parent_id' => $grup, 'title' => self::JUDUL_LAMA, 'route_name' => self::ROUTE_BARU,
                'order' => $urutan, 'is_active' => true, 'created_at' => now(), 'updated_at' => now(),
            ]);
        }
        $menuBaru = DB::table('menus')->where('route_name', self::ROUTE_BARU)->value('id');

        // Role yang punya menu approval lama mendapat menu baru (Admin selalu)
        $roles = $lama
            ? DB::table('role_has_menus')->where('menu_id', $lama->id)->pluck('role_id')->push(1)->unique()
            : collect([1, 2, 3, 4, 5]);
        foreach ($roles as $roleId) {
            if (! DB::table('roles')->where('id', $roleId)->exists()) {
                continue;
            }
            foreach ([$menuBaru, $grup] as $id) {
                if (! DB::table('role_has_menus')->where('role_id', $roleId)->where('menu_id', $id)->exists()) {
                    DB::table('role_has_menus')->insertOrIgnore([
                        'role_id' => $roleId, 'menu_id' => $id, 'created_at' => now(), 'updated_at' => now(),
                    ]);
                }
            }
        }

        if ($lama) {
            DB::table('menus')->where('id', $lama->id)->update(['title' => self::JUDUL_ARSIP, 'order' => 9, 'updated_at' => now()]);
        }
    }

    public function down(): void
    {
        $menuBaru = DB::table('menus')->where('route_name', self::ROUTE_BARU)->value('id');
        if ($menuBaru) {
            $urutan = DB::table('menus')->where('id', $menuBaru)->value('order');
            DB::table('role_has_menus')->where('menu_id', $menuBaru)->delete();
            DB::table('menus')->where('id', $menuBaru)->delete();
            DB::table('menus')->where('route_name', self::ROUTE_LAMA)->update(['title' => self::JUDUL_LAMA, 'order' => $urutan ?? 3]);
        }
    }
};
