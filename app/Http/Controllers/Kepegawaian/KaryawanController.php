<?php

namespace App\Http\Controllers\Kepegawaian;

use App\Http\Controllers\Controller;
use App\Models\Karyawan;
use App\Models\Departemen;
use App\Models\Jabatan;
use App\Models\Golongan;
use App\Models\Role;
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
        // Menambahkan relasi 'atasan' agar tampil di tabel
        $karyawans = Karyawan::with(['departemen', 'jabatan', 'golongan', 'atasan'])->latest()->get();
        return Inertia::render('Kepegawaian/Karyawan/Index', [
            'karyawans' => $karyawans
        ]);
    }

    public function create()
    {
        $ptkps = DB::table('master_ptkps')->get();

        return Inertia::render('Kepegawaian/Karyawan/Create', [
            'departemens' => Departemen::orderBy('nama_departemen')->get(),
            'jabatans' => Jabatan::orderBy('nama_jabatan')->get(),
            'golongans' => Golongan::orderBy('kode_golongan')->get(),
            'ptkps' => $ptkps,
            'roles' => Role::orderBy('id')->get(), // Suntikan RBAC
            'atasans' => Karyawan::where('status_aktif', true)->orderBy('nama_lengkap')->get(), // Suntikan Direct Reporting
        ]);
    }

    public function store(Request $request)
    {
        // 1. Validasi Input Super Ketat (Ditambah atasan_id dan role_id)
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
            'role_id' => 'required|exists:roles,id', // Validasi RBAC
            'atasan_id' => 'nullable|exists:karyawans,id', // Validasi Direct Reporting (Nullable untuk CEO)

            'no_ktp' => 'required|string',
            'npwp' => 'nullable|string',
            'no_rek_bca' => 'nullable|string',

            'no_bpjs_kesehatan' => 'nullable|string',
            'no_bpjs_ketenagakerjaan' => 'nullable|string',
        ]);

        // 2. Pelindung Kegagalan (Database Transaction)
        DB::beginTransaction();
        try {
            // A. Buat Akun Login Otomatis dengan Role yang dipilih
            $user = User::create([
                'name' => $validated['nama_lengkap'],
                'username' => $validated['nik_internal'],
                'email' => $validated['email_kantor'],
                'password' => Hash::make($validated['nik_internal']), // Default Password = NIK
                'role_id' => $validated['role_id'], 
            ]);

            // B. Simpan Data Karyawan & Enkripsi Data Sensitif
            Karyawan::create([
                'user_id' => $user->id,
                'departemen_id' => $validated['departemen_id'],
                'jabatan_id' => $validated['jabatan_id'],
                'golongan_id' => $validated['golongan_id'],
                'ptkp_id' => $validated['ptkp_id'],
                'atasan_id' => $validated['atasan_id'], // Injeksi Atasan

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

            DB::commit();
            return redirect()->route('karyawan.index')->with('success', 'Karyawan dan Akun Login berhasil dibuat!');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Gagal menyimpan data: ' . $e->getMessage()]);
        }
    }

    public function edit($id)
    {
        $karyawan = Karyawan::with('user')->findOrFail($id);

        // 1. Dekripsi data sensitif agar bisa dibaca oleh HC di form Edit
        $karyawan->no_ktp = Crypt::decryptString($karyawan->no_ktp_encrypted);
        $karyawan->npwp = $karyawan->npwp_encrypted ? Crypt::decryptString($karyawan->npwp_encrypted) : '';
        $karyawan->no_rek_bca = $karyawan->no_rek_bca_encrypted ? Crypt::decryptString($karyawan->no_rek_bca_encrypted) : '';

        return Inertia::render('Kepegawaian/Karyawan/Edit', [
            'karyawan' => $karyawan,
            'departemens' => Departemen::orderBy('nama_departemen')->get(),
            'jabatans' => Jabatan::orderBy('nama_jabatan')->get(),
            'golongans' => Golongan::orderBy('kode_golongan')->get(),
            'ptkps' => DB::table('master_ptkps')->get(),
            'roles' => Role::orderBy('id')->get(),
            'atasans' => Karyawan::where('status_aktif', true)->where('id', '!=', $id)->orderBy('nama_lengkap')->get(), // Mencegah atasan ke dirinya sendiri
        ]);
    }

    public function update(Request $request, $id)
    {
        $karyawan = Karyawan::findOrFail($id);

        // 2. Pengecualian Validasi untuk Unique Rule
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
            'role_id' => 'required|exists:roles,id',
            'atasan_id' => 'nullable|exists:karyawans,id|different:id', // Tidak boleh lapor ke diri sendiri

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
                'role_id' => $validated['role_id'],
            ]);

            // B. Simpan Pembaruan Karyawan & Enkripsi Ulang KTP/Rekening
            $karyawan->update([
                'departemen_id' => $validated['departemen_id'],
                'jabatan_id' => $validated['jabatan_id'],
                'golongan_id' => $validated['golongan_id'],
                'ptkp_id' => $validated['ptkp_id'],
                'atasan_id' => $validated['atasan_id'],

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

            // 3. Pembersihan Menyeluruh
            $karyawan->delete();
            User::where('id', $userId)->delete(); 

            DB::commit();
            return redirect()->route('karyawan.index')->with('success', 'Karyawan dan akun loginnya berhasil dihapus.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Gagal menghapus data: ' . $e->getMessage()]);
        }
    }

    public function show($id)
    {
        $karyawan = Karyawan::with([
            'departemen',
            'jabatan',
            'golongan',
            'user',
            'atasan', // Pastikan atasan juga diload untuk UI Show
            'riwayatGajis',
            'riwayatJabatans.jabatan'
        ])->findOrFail($id);

        $karyawan->no_ktp = Crypt::decryptString($karyawan->no_ktp_encrypted);
        $karyawan->npwp = $karyawan->npwp_encrypted ? Crypt::decryptString($karyawan->npwp_encrypted) : 'Belum Tersedia';
        $karyawan->no_rek_bca = $karyawan->no_rek_bca_encrypted ? Crypt::decryptString($karyawan->no_rek_bca_encrypted) : 'Belum Tersedia';

        return Inertia::render('Kepegawaian/Karyawan/Show', [
            'karyawan' => $karyawan,
            'jabatans' => Jabatan::orderBy('nama_jabatan')->get(),
        ]);
    }

    public function updateGaji(Request $request, $id)
    {
        $request->validate([
            'nominal_gaji_pokok' => 'required|numeric|min:0',
            'effective_date_start' => 'required|date',
        ]);

        DB::beginTransaction();
        try {
            $riwayatAktif = \App\Models\RiwayatGaji::where('karyawan_id', $id)
                ->whereNull('effective_date_end')
                ->orderBy('effective_date_start', 'desc')
                ->first();

            if ($riwayatAktif) {
                $tanggalTutup = \Carbon\Carbon::parse($request->effective_date_start)->subDay()->toDateString();
                $riwayatAktif->update(['effective_date_end' => $tanggalTutup]);
            }

            \App\Models\RiwayatGaji::create([
                'karyawan_id' => $id,
                'nominal_gaji_pokok' => $request->nominal_gaji_pokok,
                'effective_date_start' => $request->effective_date_start,
            ]);

            DB::commit();
            return back()->with('success', 'Riwayat Gaji berhasil diperbarui.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Gagal memperbarui gaji: ' . $e->getMessage()]);
        }
    }

    public function updateJabatan(Request $request, $id)
    {
        $request->validate([
            'jabatan_id' => 'required|exists:jabatans,id',
            'effective_date_start' => 'required|date',
        ]);

        DB::beginTransaction();
        try {
            $riwayatAktif = \App\Models\RiwayatJabatan::where('karyawan_id', $id)
                ->whereNull('effective_date_end')
                ->orderBy('effective_date_start', 'desc')
                ->first();

            if ($riwayatAktif) {
                $tanggalTutup = \Carbon\Carbon::parse($request->effective_date_start)->subDay()->toDateString();
                $riwayatAktif->update(['effective_date_end' => $tanggalTutup]);
            }

            \App\Models\RiwayatJabatan::create([
                'karyawan_id' => $id,
                'jabatan_id' => $request->jabatan_id,
                'effective_date_start' => $request->effective_date_start,
            ]);

            $karyawan = Karyawan::findOrFail($id);
            $karyawan->update(['jabatan_id' => $request->jabatan_id]);

            DB::commit();
            return back()->with('success', 'Riwayat Jabatan berhasil diperbarui.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Gagal memperbarui jabatan: ' . $e->getMessage()]);
        }
    }
}