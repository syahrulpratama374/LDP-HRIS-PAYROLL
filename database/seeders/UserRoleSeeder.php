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
            ['name' => 'Akun Super Admin', 'username' => 'superadmin', 'email' => 'admin@ldp.co.id', 'role_id' => 1],
            ['name' => 'Akun Direktur', 'username' => 'direktur', 'email' => 'direktur@ldp.co.id', 'role_id' => 2],
            ['name' => 'Akun HRD', 'username' => 'hrd', 'email' => 'hrd@ldp.co.id', 'role_id' => 3],
            ['name' => 'Akun Finance', 'username' => 'finance', 'email' => 'finance@ldp.co.id', 'role_id' => 4],
            ['name' => 'Akun Supervisor', 'username' => 'supervisor', 'email' => 'spv@ldp.co.id', 'role_id' => 5],
            ['name' => 'Akun Karyawan', 'username' => 'karyawan', 'email' => 'karyawan@ldp.co.id', 'role_id' => 6],
        ];

        foreach ($users as $user) {
            User::updateOrCreate(
                ['email' => $user['email']],
                [
                    'name' => $user['name'],
                    'username' => $user['username'], // Kolom tambahan agar tidak error
                    'password' => Hash::make('password123'),
                    'role_id' => $user['role_id'] 
                ]
            );
        }
    }
}