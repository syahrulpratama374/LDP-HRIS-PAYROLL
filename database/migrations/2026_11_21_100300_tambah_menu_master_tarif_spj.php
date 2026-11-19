<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Data: menu "Master Tarif SPJ" di grup Master Data untuk Admin, HC, dan Finance (lihat saja).
 * Ditambahkan lewat migrasi karena MenuSeeder membangun ulang seluruh role_has_menus
 * (perubahan dari UI Role akan hilang bila MenuSeeder dijalankan ulang).
 * Hanya menambah bila belum ada; aman diulang; bisa dibalik. Di DB baru (grup Master Data belum ada)
 * migrasi ini tidak melakukan apa pun; MenuSeeder yang menangani.
 */
return new class extends Migration
{
    private const ROUTE = 'tarif-spj.index';

    private const ROLES = [1, 3, 4];

    public function up(): void
    {
        $grup = DB::table('menus')->whereNull('parent_id')->where('title', 'Master Data')->value('id');
        if (! $grup) {
            // DB baru (menu belum di-seed): MenuSeeder yang membuat menu ini beserta hak aksesnya
            return;
        }

        $menuId = DB::table('menus')->where('route_name', self::ROUTE)->value('id')
            ?? DB::table('menus')->insertGetId([
                'parent_id' => $grup, 'title' => 'Master Tarif SPJ', 'route_name' => self::ROUTE,
                'order' => 9, 'is_active' => true, 'created_at' => now(), 'updated_at' => now(),
            ]);

        foreach (self::ROLES as $roleId) {
            if (! DB::table('roles')->where('id', $roleId)->exists()) {
                continue;
            }
            foreach ([$menuId, $grup] as $id) {
                $ada = DB::table('role_has_menus')->where('role_id', $roleId)->where('menu_id', $id)->exists();
                if (! $ada) {
                    DB::table('role_has_menus')->insert([
                        'role_id' => $roleId, 'menu_id' => $id, 'created_at' => now(), 'updated_at' => now(),
                    ]);
                }
            }
        }
    }

    public function down(): void
    {
        $menuId = DB::table('menus')->where('route_name', self::ROUTE)->value('id');
        if ($menuId) {
            DB::table('role_has_menus')->where('menu_id', $menuId)->delete();
            DB::table('menus')->where('id', $menuId)->delete();
        }
    }
};
