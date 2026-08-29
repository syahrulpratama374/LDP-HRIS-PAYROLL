<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Role;
use App\Models\Karyawan;
use App\Models\Departemen;
use App\Models\Jabatan;
use App\Models\Golongan;
use App\Models\MasterPtkp; // <-- Ubah dari MasterPtpk menjadi MasterPtkp
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Crypt;
use Carbon\Carbon;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $adminRole = Role::firstOrCreate(['nama_role' => 'Super Admin']);
        $karyawanRole = Role::firstOrCreate(['nama_role' => 'Karyawan']);

        // 2. Buat Master Data Draf otomatis dengan melengkapi kolom 'kode' yang diwajibkan database
        $departemen = Departemen::firstOrCreate(
            ['nama_departemen' => 'Information Technology (IT)'],
            ['kode_departemen' => 'IT'] // <-- Menutupi kolom kode_departemen yang wajib diisi
        );

        $jabatan = Jabatan::firstOrCreate(
            ['nama_jabatan' => 'Staff Pelaksana'],
            ['kode_jabatan' => 'STF'] // Tambahkan jika tabel jabatans juga punya kolom kode
        );

        $golongan = Golongan::firstOrCreate(
            ['nama_golongan' => 'Golongan I/A'],
            [
                'kode_golongan' => 'G1A',
                'gaji_pokok' => 3000000 // <-- Tambahkan nilai gaji pokok di sini
            ] // Tambahkan jika tabel golongans juga punya kolom kode
        );
        // Menambahkan draf PTKP agar kolom ptkp_id tidak bernilai null
        $ptkp = MasterPtkp::firstOrCreate(['kode_ptkp' => 'TK/0'], [
            'deskripsi' => 'Tidak Kawin Tanpa Tanggungan',
            'nominal_neto_tahunan' => 54000000 // <-- Nama kolom diubah menyesuaikan migrasi
        ]);

        User::firstOrCreate(
            ['username' => 'syahrul.admin'],
            [
                'name' => 'Syahrul Pratama',
                'email' => 'admin@ldp.com',
                'password' => Hash::make('password123'),
                'role_id' => $adminRole->id,
            ]
        );

        $nikKaryawan = '12345678';

        $userKaryawan = User::updateOrCreate(
            ['username' => $nikKaryawan],
            [
                'name' => 'Kevin Tama',
                'email' => 'kevin@gmail.com',
                'password' => Hash::make('12345678'),
                'role_id' => $karyawanRole->id,
            ]
        );

        Karyawan::updateOrCreate(
            ['nik_internal' => $nikKaryawan],
            [
                'user_id' => $userKaryawan->id,
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
