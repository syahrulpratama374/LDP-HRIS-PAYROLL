<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Karyawan;
use App\Models\Departemen;
use App\Models\Jabatan;
use App\Models\Golongan;
use App\Models\MasterPtkp;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Crypt;
use Carbon\Carbon;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Buat Master Data Draf otomatis untuk relasi Karyawan
        $departemen = Departemen::firstOrCreate(
            ['kode_departemen' => 'IT'],
            ['nama_departemen' => 'Information Technology (IT)'] 
        );

        $jabatan = Jabatan::firstOrCreate(
            ['kode_jabatan' => 'STF'],
            ['nama_jabatan' => 'Staff Pelaksana'] 
        );

        $golongan = Golongan::firstOrCreate(
            ['kode_golongan' => 'G1A'],
            ['nama_golongan' => 'Golongan I/A', 'gaji_pokok' => 3000000] 
        );
        
        $ptkp = MasterPtkp::firstOrCreate(
            ['kode_ptkp' => 'TK/0'], 
            ['deskripsi' => 'Tidak Kawin Tanpa Tanggungan', 'nominal_neto_tahunan' => 54000000] 
        );

        // 2. Akun Admin Utama (Syahrul) -> role_id 1
        User::updateOrCreate(
            ['email' => 'admin@ldp.co.id'],
            [
                'name' => 'Syahrul Pratama',
                'username' => 'syahrul.admin',
                'password' => Hash::make('password123'),
                'role_id' => 1,
            ]
        );

        // 3. Akun Eksekutif & Manajerial (Opsional untuk testing login multi-role)
        $manajemen = [
            ['name' => 'Direktur LDP', 'username' => 'direktur', 'email' => 'direktur@ldp.co.id', 'role_id' => 2],
            ['name' => 'HRD LDP', 'username' => 'hrd', 'email' => 'hrd@ldp.co.id', 'role_id' => 3],
            ['name' => 'Finance LDP', 'username' => 'finance', 'email' => 'finance@ldp.co.id', 'role_id' => 4],
            ['name' => 'Supervisor Cabang', 'username' => 'spv', 'email' => 'spv@ldp.co.id', 'role_id' => 5],
        ];

        foreach ($manajemen as $user) {
            User::updateOrCreate(
                ['email' => $user['email']],
                [
                    'name' => $user['name'],
                    'username' => $user['username'],
                    'password' => Hash::make('password123'),
                    'role_id' => $user['role_id'],
                ]
            );
        }

        // 4. Akun Karyawan (Kevin Tama) -> role_id 6
        $nikKaryawan = '12345678';
        $userKaryawan = User::updateOrCreate(
            ['email' => 'kevin@gmail.com'],
            [
                'name' => 'Kevin Tama',
                'username' => $nikKaryawan,
                'password' => Hash::make('12345678'),
                'role_id' => 6,
            ]
        );

        // 5. Injeksi Profil Detail Karyawan
        Karyawan::updateOrCreate(
            ['user_id' => $userKaryawan->id],
            [
                'nik_internal' => $nikKaryawan,
                'departemen_id' => $departemen->id,
                'jabatan_id' => $jabatan->id,
                'golongan_id' => $golongan->id,
                'ptkp_id' => $ptkp->id,
                'nama_lengkap' => 'Kevin Tama',
                'tempat_lahir' => 'Bantul',
                'tgl_lahir' => '1995-12-24',
                'agama' => 'Islam',
                'status_pernikahan' => 'Belum Kawin',
                'email_kantor' => 'kevin@gmail.com',
                'no_telp' => '082122223333',
                'tgl_bergabung' => Carbon::now()->toDateString(),
                'no_ktp_encrypted' => Crypt::encryptString('3501234567899999'),
                'npwp_encrypted' => Crypt::encryptString('123456789012399'),
                'no_rek_bca_encrypted' => Crypt::encryptString('0123456788'),
                'status_aktif' => 1,
            ]
        );
    }
}