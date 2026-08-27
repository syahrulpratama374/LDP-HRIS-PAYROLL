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
        $adminRole = Role::where('nama_role', 'Super Admin')->first();

        User::create([
            'name' => 'Syahrul Pratama',
            'username' => 'syahrul.admin',
            'email' => 'admin@ldp.com',
            'password' => Hash::make('password123'), 
            'role_id' => $adminRole->id,
        ]);
    }
}