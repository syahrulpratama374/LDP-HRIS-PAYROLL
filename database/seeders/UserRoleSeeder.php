<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Role;

class UserRoleSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            ['id' => 1, 'nama_role' => 'Admin'],
            ['id' => 2, 'nama_role' => 'Direktur'],
            ['id' => 3, 'nama_role' => 'HC'],
            ['id' => 4, 'nama_role' => 'Finance'],
            ['id' => 5, 'nama_role' => 'Supervisor'],
            ['id' => 6, 'nama_role' => 'Karyawan'],
        ];

        foreach ($roles as $role) {
            Role::updateOrCreate(['id' => $role['id']], $role);
        }
    }
}