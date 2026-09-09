<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use App\Models\User;
use App\Models\Karyawan;
use App\Models\Departemen;
use App\Models\Jabatan;
use App\Models\Golongan;
use App\Models\MasterPtkp;

class LdpStrukturSeeder extends Seeder
{
    /**
     * Fungsi Helper untuk mempercepat pembuatan akun User sekaligus profil Karyawan
     */
    private function buatKaryawan($nama, $email, $roleId, $deptId, $jabatanId, $atasanId = null)
    {
        $username = explode('@', $email)[0];

        $user = User::firstOrCreate(
            ['email' => $email],
            [
                'name' => $nama, 
                'username' => $username,
                'password' => Hash::make('password123'), 
                'role_id' => $roleId
            ]
        );

        // Ambil data Golongan & PTKP pertama (karena sudah dibuat di MasterDataSeeder)
        // Jika belum ada, otomatis buatkan dummy agar tidak error
        $golongan = Golongan::firstOrCreate(['kode_golongan' => 'G1'], ['nama_golongan' => 'Golongan 1', 'gaji_pokok' => 5000000]);
        $ptkp = MasterPtkp::firstOrCreate(['kode_ptkp' => 'TK/0'], ['nominal_neto_tahunan' => 54000000]);

        return Karyawan::firstOrCreate(
            ['user_id' => $user->id],
            [
                'nama_lengkap' => $nama,
                'departemen_id' => $deptId,
                'jabatan_id' => $jabatanId,
                'golongan_id' => $golongan->id,       // WAJIB DIISI
                'ptkp_id' => $ptkp->id,               // WAJIB DIISI
                'nik_internal' => 'LDP-' . strtoupper(Str::random(5)), // WAJIB DIISI
                'tempat_lahir' => 'Yogyakarta',       // WAJIB DIISI
                'tgl_lahir' => '1990-01-01',          // WAJIB DIISI
                'agama' => 'Islam',                   // WAJIB DIISI
                'status_pernikahan' => 'Belum Kawin', // WAJIB DIISI
                'tgl_bergabung' => date('Y-m-d'),     // WAJIB DIISI
                'no_ktp_encrypted' => 'DUMMY_KTP_ENCRYPTED_1234567890', // WAJIB DIISI
                'atasan_id' => $atasanId,
                'status_aktif' => true,
            ]
        );
    }

    public function run(): void
    {
        // 1. MASTER DATA DEPARTEMEN
        $dDireksi = Departemen::firstOrCreate(['kode_departemen' => 'BOD'], ['nama_departemen' => 'Board of Directors']);
        $dCreative = Departemen::firstOrCreate(['kode_departemen' => 'CRE'], ['nama_departemen' => 'Artistic & Creative']);
        $dSales = Departemen::firstOrCreate(['kode_departemen' => 'SLS'], ['nama_departemen' => 'Sales & Marketing']);
        $dHc = Departemen::firstOrCreate(['kode_departemen' => 'HC'], ['nama_departemen' => 'Human Capital']);
        $dGov = Departemen::firstOrCreate(['kode_departemen' => 'GOV'], ['nama_departemen' => 'Government & Partnership']);
        $dFinance = Departemen::firstOrCreate(['kode_departemen' => 'FIN'], ['nama_departemen' => 'Finance & Accounting']);
        $dOpm = Departemen::firstOrCreate(['kode_departemen' => 'OPM'], ['nama_departemen' => 'Operation & Maintenance (OPM)']);
        $dInfra = Departemen::firstOrCreate(['kode_departemen' => 'INF'], ['nama_departemen' => 'Infra & Backbone']);
        $dBro = Departemen::firstOrCreate(['kode_departemen' => 'BRO'], ['nama_departemen' => 'Business Relation']);

        // 2. MASTER DATA JABATAN
        $jCeo = Jabatan::firstOrCreate(['kode_jabatan' => 'CEO'], ['nama_jabatan' => 'Chief Executive Officer']);
        $jMd = Jabatan::firstOrCreate(['kode_jabatan' => 'MD'], ['nama_jabatan' => 'Managing Director']);
        $jHead = Jabatan::firstOrCreate(['kode_jabatan' => 'MGR'], ['nama_jabatan' => 'Head / Manager']);
        $jSpv = Jabatan::firstOrCreate(['kode_jabatan' => 'SPV'], ['nama_jabatan' => 'Supervisor']);
        $jStaff = Jabatan::firstOrCreate(['kode_jabatan' => 'STF'], ['nama_jabatan' => 'Staff Pelaksana']);

        // 3. TREE STRUCTURE HIERARCHY
        
        // --- TIER 0 & 1: TOP MANAGEMENT ---
        $ceo = $this->buatKaryawan('Wahyu Jatmiko', 'ceo@ldp.co.id', 2, $dDireksi->id, $jCeo->id);
        $md = $this->buatKaryawan('Hanif Purnomo', 'md@ldp.co.id', 2, $dDireksi->id, $jMd->id, $ceo->id);

        // --- TIER 2: MANAGERS & HEADS ---
        $mCreative = $this->buatKaryawan('Fahla F Lotan', 'fahla@ldp.co.id', 5, $dCreative->id, $jHead->id, $md->id);
        $mSales1 = $this->buatKaryawan('Mikha Kristiana', 'mikha@ldp.co.id', 5, $dSales->id, $jHead->id, $md->id);
        $mSales2 = $this->buatKaryawan('Sulistyanto', 'sulistyanto@ldp.co.id', 5, $dSales->id, $jHead->id, $md->id);
        
        $mHc = $this->buatKaryawan('Yoga Putra S', 'yoga@ldp.co.id', 3, $dHc->id, $jHead->id, $md->id);
        $mGov = $this->buatKaryawan('Yanis Taufik', 'yanis@ldp.co.id', 5, $dGov->id, $jHead->id, $md->id);
        
        $mFinance = $this->buatKaryawan('Muslih Agung N', 'muslih@ldp.co.id', 4, $dFinance->id, $jHead->id, $md->id);
        $mOpm = $this->buatKaryawan('Nanang Purnomo', 'nanang@ldp.co.id', 5, $dOpm->id, $jHead->id, $md->id);
        $mInfra = $this->buatKaryawan('M.Ridwan Nur', 'ridwan@ldp.co.id', 5, $dInfra->id, $jHead->id, $md->id);
        
        $mBro = $this->buatKaryawan('Elvira Savitri', 'elvira@ldp.co.id', 5, $dBro->id, $jHead->id, $md->id);

        // --- TIER 3: SUPERVISORS ---
        $sHc = $this->buatKaryawan('M.A Hakim', 'hakim@ldp.co.id', 5, $dHc->id, $jSpv->id, $mHc->id);
        $this->buatKaryawan('Staff HC Satu', 'staff.hc1@ldp.co.id', 6, $dHc->id, $jStaff->id, $sHc->id);
        
        $sFinance = $this->buatKaryawan('Anas Fauzi', 'anas@ldp.co.id', 5, $dFinance->id, $jSpv->id, $mFinance->id);
        $this->buatKaryawan('Staff Finance Satu', 'staff.fin1@ldp.co.id', 6, $dFinance->id, $jStaff->id, $sFinance->id);
        
        $sOpm1 = $this->buatKaryawan('Puji Dwi H', 'puji@ldp.co.id', 5, $dOpm->id, $jSpv->id, $mOpm->id);
        $sOpm2 = $this->buatKaryawan('Septian Ardianta', 'septian@ldp.co.id', 5, $dOpm->id, $jSpv->id, $mOpm->id);
        $sOpm3 = $this->buatKaryawan('Bambang Edi L', 'bambang@ldp.co.id', 5, $dOpm->id, $jSpv->id, $mOpm->id);
        
        $this->buatKaryawan('Syahrul Pratama', 'syahrul@ldp.co.id', 6, $dOpm->id, $jStaff->id, $sOpm1->id);
        $this->buatKaryawan('Staff NOC Dua', 'staff.noc2@ldp.co.id', 6, $dOpm->id, $jStaff->id, $sOpm1->id);
        $this->buatKaryawan('Staff POP Satu', 'staff.pop1@ldp.co.id', 6, $dOpm->id, $jStaff->id, $sOpm2->id);
        $this->buatKaryawan('Staff CS Satu', 'staff.cs1@ldp.co.id', 6, $dOpm->id, $jStaff->id, $sOpm3->id);

        $sInfra1 = $this->buatKaryawan('Bagus Dwi N', 'bagusdwi@ldp.co.id', 5, $dInfra->id, $jSpv->id, $mInfra->id);
        $sInfra2 = $this->buatKaryawan('Abi Yoga', 'abi@ldp.co.id', 5, $dInfra->id, $jSpv->id, $mInfra->id);
        $sInfra3 = $this->buatKaryawan('Puguh Umar', 'puguh@ldp.co.id', 5, $dInfra->id, $jSpv->id, $mInfra->id);

        $this->buatKaryawan('Staff Wk OPM 1', 'staff.wkopm1@ldp.co.id', 6, $dInfra->id, $jStaff->id, $sInfra1->id);
        $this->buatKaryawan('Staff Backbone 1', 'staff.bb1@ldp.co.id', 6, $dInfra->id, $jStaff->id, $sInfra2->id);
        $this->buatKaryawan('Staff Dist 1', 'staff.dist1@ldp.co.id', 6, $dInfra->id, $jStaff->id, $sInfra3->id);

        $this->command->info('Seeding Struktur Organisasi LDP 2026 Selesai dengan Field Lengkap!');
    }
}