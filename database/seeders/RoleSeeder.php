<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Role;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            'Super Admin',
            'Direktur',
            'HRD',
            'Finance',
            'Supervisor',
            'Karyawan'
        ];

        foreach ($roles as $role) {
            Role::create(['nama_role' => $role]);
        }
    }
}