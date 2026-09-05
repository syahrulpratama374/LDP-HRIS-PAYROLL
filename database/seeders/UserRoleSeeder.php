<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserRoleSeeder extends Seeder
{
    public function run()
    {
        $users = [
            ['name' => 'Akun Super Admin', 'username' => 'superadmin', 'email' => 'admin@ldp.co.id', 'role' => 'Admin'],
            ['name' => 'Akun Direktur', 'username' => 'direktur', 'email' => 'direktur@ldp.co.id', 'role' => 'Direktur'],
            ['name' => 'Akun HRD', 'username' => 'hrd', 'email' => 'hrd@ldp.co.id', 'role' => 'HC'],
            ['name' => 'Akun Finance', 'username' => 'finance', 'email' => 'finance@ldp.co.id', 'role' => 'Finance'],
            ['name' => 'Akun Supervisor', 'username' => 'supervisor', 'email' => 'spv@ldp.co.id', 'role' => 'Supervisor'],
            ['name' => 'Akun Karyawan', 'username' => 'karyawan', 'email' => 'karyawan@ldp.co.id', 'role' => 'Karyawan'],
        ];

        foreach ($users as $user) {
            User::updateOrCreate(
                ['email' => $user['email']],
                [
                    'name' => $user['name'],
                    'username' => $user['username'],
                    'password' => Hash::make('password123'),
                    'role' => $user['role'] // Diubah dari role_id menjadi role
                ]
            );
        }
    }
}