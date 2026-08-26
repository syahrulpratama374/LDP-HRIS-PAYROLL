<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Role;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // Mencari ID dari role Super Admin
        $adminRole = Role::where('nama_role', 'Super Admin')->first();

        // Membuat akun utama
        User::create([
            'name' => 'Syahrul Pratama',
            'username' => 'syahrul.admin',
            'email' => 'admin@ldp.com',
            'password' => Hash::make('password123'), 
            'role_id' => $adminRole->id,
            'karyawan_id' => null, 
        ]);
    }
}