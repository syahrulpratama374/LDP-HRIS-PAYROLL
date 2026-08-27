<?php

namespace App\Http\Controllers\Kepegawaian;

use App\Http\Controllers\Controller;
use App\Models\Karyawan;
use App\Models\Departemen;
use App\Models\Jabatan;
use App\Models\Golongan;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Crypt;

class KaryawanController extends Controller
{
    public function index()
    {
        $karyawans = Karyawan::with(['departemen', 'jabatan', 'golongan'])->latest()->get();
        return Inertia::render('Kepegawaian/Karyawan/Index', [
            'karyawans' => $karyawans
        ]);
    }

    public function create()
    {
        // Pastikan tabel master_ptkps sudah ada isinya atau minimal tidak error saat dipanggil
        $ptkps = DB::table('master_ptkps')->get(); 

        return Inertia::render('Kepegawaian/Karyawan/Create', [
            'departemens' => Departemen::orderBy('nama_departemen')->get(),
            'jabatans' => Jabatan::orderBy('nama_jabatan')->get(),
            'golongans' => Golongan::orderBy('kode_golongan')->get(),
            'ptkps' => $ptkps,
        ]);
    }

    public function store(Request $request)
    {
        // 1. Validasi Input Super Ketat
        $validated = $request->validate([
            'nik_internal' => 'required|string|max:50|unique:karyawans',
            'nama_lengkap' => 'required|string|max:150',
            'tempat_lahir' => 'required|string|max:100',
            'tgl_lahir' => 'required|date',
            'agama' => 'required|string|max:30',
            'status_pernikahan' => 'required|string|max:30',
            'email_kantor' => 'required|email|unique:karyawans|unique:users,email',
            'no_telp' => 'nullable|string|max:20',
            'tgl_bergabung' => 'required|date',
            
            'departemen_id' => 'required|exists:departemens,id',
            'jabatan_id' => 'required|exists:jabatans,id',
            'golongan_id' => 'required|exists:golongans,id',
            'ptkp_id' => 'required|exists:master_ptkps,id',
            
            'no_ktp' => 'required|string',
            'npwp' => 'nullable|string',
            'no_rek_bca' => 'nullable|string',
            
            'no_bpjs_kesehatan' => 'nullable|string',
            'no_bpjs_ketenagakerjaan' => 'nullable|string',
        ]);

        // 2. Pelindung Kegagalan (Database Transaction)
        DB::beginTransaction();
        try {
            // A. Buat Akun Login Otomatis (Password default = NIK)
            $user = User::create([
                'name' => $validated['nama_lengkap'],
                'username' => $validated['nik_internal'],
                'email' => $validated['email_kantor'],
                'password' => Hash::make($validated['nik_internal']), 
                'role_id' => 2, // Asumsi Role ID 2 adalah Karyawan Biasa
            ]);

            // B. Simpan Data Karyawan & Enkripsi Data Sensitif
            Karyawan::create([
                'user_id' => $user->id,
                'departemen_id' => $validated['departemen_id'],
                'jabatan_id' => $validated['jabatan_id'],
                'golongan_id' => $validated['golongan_id'],
                'ptkp_id' => $validated['ptkp_id'],
                
                'nik_internal' => $validated['nik_internal'],
                'nama_lengkap' => $validated['nama_lengkap'],
                'tempat_lahir' => $validated['tempat_lahir'],
                'tgl_lahir' => $validated['tgl_lahir'],
                'agama' => $validated['agama'],
                'status_pernikahan' => $validated['status_pernikahan'],
                'email_kantor' => $validated['email_kantor'],
                'no_telp' => $validated['no_telp'],
                'tgl_bergabung' => $validated['tgl_bergabung'],
                
                // Proses Enkripsi Tingkat Militer
                'no_ktp_encrypted' => Crypt::encryptString($validated['no_ktp']),
                'npwp_encrypted' => $validated['npwp'] ? Crypt::encryptString($validated['npwp']) : null,
                'no_rek_bca_encrypted' => $validated['no_rek_bca'] ? Crypt::encryptString($validated['no_rek_bca']) : null,
                
                'no_bpjs_kesehatan' => $validated['no_bpjs_kesehatan'],
                'no_bpjs_ketenagakerjaan' => $validated['no_bpjs_ketenagakerjaan'],
                'status_aktif' => true,
            ]);

            DB::commit(); // Kunci data jika semua sukses
            return redirect()->route('karyawan.index')->with('success', 'Karyawan dan Akun Login berhasil dibuat!');

        } catch (\Exception $e) {
            DB::rollBack(); // Batalkan semua jika ada yang gagal
            return back()->withErrors(['error' => 'Gagal menyimpan data: ' . $e->getMessage()]);
        }
    }
    public function edit($id)
    {
        $karyawan = Karyawan::findOrFail($id);

        // 1. Dekripsi data sensitif agar bisa dibaca oleh HRD di form Edit
        $karyawan->no_ktp = Crypt::decryptString($karyawan->no_ktp_encrypted);
        $karyawan->npwp = $karyawan->npwp_encrypted ? Crypt::decryptString($karyawan->npwp_encrypted) : '';
        $karyawan->no_rek_bca = $karyawan->no_rek_bca_encrypted ? Crypt::decryptString($karyawan->no_rek_bca_encrypted) : '';

        return Inertia::render('Kepegawaian/Karyawan/Edit', [
            'karyawan' => $karyawan,
            'departemens' => Departemen::orderBy('nama_departemen')->get(),
            'jabatans' => Jabatan::orderBy('nama_jabatan')->get(),
            'golongans' => Golongan::orderBy('kode_golongan')->get(),
            'ptkps' => DB::table('master_ptkps')->get(),
        ]);
    }

    public function update(Request $request, $id)
    {
        $karyawan = Karyawan::findOrFail($id);

        // 2. Pengecualian Validasi: Abaikan pengecekan 'unique' jika itu adalah ID karyawan ini sendiri
        $validated = $request->validate([
            'nik_internal' => 'required|string|max:50|unique:karyawans,nik_internal,' . $karyawan->id,
            'nama_lengkap' => 'required|string|max:150',
            'tempat_lahir' => 'required|string|max:100',
            'tgl_lahir' => 'required|date',
            'agama' => 'required|string|max:30',
            'status_pernikahan' => 'required|string|max:30',
            'email_kantor' => 'required|email|unique:karyawans,email_kantor,' . $karyawan->id,
            'no_telp' => 'nullable|string|max:20',
            'tgl_bergabung' => 'required|date',
            
            'departemen_id' => 'required|exists:departemens,id',
            'jabatan_id' => 'required|exists:jabatans,id',
            'golongan_id' => 'required|exists:golongans,id',
            'ptkp_id' => 'required|exists:master_ptkps,id',
            
            'no_ktp' => 'required|string',
            'npwp' => 'nullable|string',
            'no_rek_bca' => 'nullable|string',
            
            'no_bpjs_kesehatan' => 'nullable|string',
            'no_bpjs_ketenagakerjaan' => 'nullable|string',
            'status_aktif' => 'required|boolean',
        ]);

        DB::beginTransaction();
        try {
            // A. Sinkronisasi perubahan data ke tabel User
            $user = User::findOrFail($karyawan->user_id);
            $user->update([
                'name' => $validated['nama_lengkap'],
                'username' => $validated['nik_internal'],
                'email' => $validated['email_kantor'],
            ]);

            // B. Simpan Pembaruan Karyawan & Enkripsi Ulang KTP/Rekening
            $karyawan->update([
                'departemen_id' => $validated['departemen_id'],
                'jabatan_id' => $validated['jabatan_id'],
                'golongan_id' => $validated['golongan_id'],
                'ptkp_id' => $validated['ptkp_id'],
                
                'nik_internal' => $validated['nik_internal'],
                'nama_lengkap' => $validated['nama_lengkap'],
                'tempat_lahir' => $validated['tempat_lahir'],
                'tgl_lahir' => $validated['tgl_lahir'],
                'agama' => $validated['agama'],
                'status_pernikahan' => $validated['status_pernikahan'],
                'email_kantor' => $validated['email_kantor'],
                'no_telp' => $validated['no_telp'],
                'tgl_bergabung' => $validated['tgl_bergabung'],
                
                'no_ktp_encrypted' => Crypt::encryptString($validated['no_ktp']),
                'npwp_encrypted' => $validated['npwp'] ? Crypt::encryptString($validated['npwp']) : null,
                'no_rek_bca_encrypted' => $validated['no_rek_bca'] ? Crypt::encryptString($validated['no_rek_bca']) : null,
                
                'no_bpjs_kesehatan' => $validated['no_bpjs_kesehatan'],
                'no_bpjs_ketenagakerjaan' => $validated['no_bpjs_ketenagakerjaan'],
                'status_aktif' => $validated['status_aktif'],
            ]);

            DB::commit();
            return redirect()->route('karyawan.index')->with('success', 'Data Karyawan berhasil diperbarui!');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Gagal memperbarui data: ' . $e->getMessage()]);
        }
    }

    public function destroy($id)
    {
        DB::beginTransaction();
        try {
            $karyawan = Karyawan::findOrFail($id);
            $userId = $karyawan->user_id;
            
            // 3. Pembersihan Menyeluruh (Soft Delete atau Hard Delete)
            $karyawan->delete();
            User::where('id', $userId)->delete(); // Hapus juga akun loginnya
            
            DB::commit();
            return redirect()->route('karyawan.index')->with('success', 'Karyawan dan akun loginnya berhasil dihapus.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Gagal menghapus data: ' . $e->getMessage()]);
        }
    }
}