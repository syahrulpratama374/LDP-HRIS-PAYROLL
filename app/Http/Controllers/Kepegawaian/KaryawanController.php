<?php

namespace App\Http\Controllers\Kepegawaian;

use App\Http\Controllers\Controller;
use App\Models\Karyawan;
use App\Models\Departemen;
use App\Models\Jabatan;
use App\Models\Golongan;
use App\Models\Role;
use App\Models\User;
use App\Models\DokumenKaryawan; // <-- Model baru
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Storage; // <-- Untuk upload file

class KaryawanController extends Controller
{
    public function index()
    {
        $karyawans = Karyawan::with(['departemen', 'jabatan', 'golongan', 'atasan'])->latest()->get();
        return Inertia::render('Kepegawaian/Karyawan/Index', [
            'karyawans' => $karyawans
        ]);
    }

    public function create()
    {
        return Inertia::render('Kepegawaian/Karyawan/Create', [
            'departemens' => Departemen::orderBy('nama_departemen')->get(),
            'jabatans' => Jabatan::orderBy('nama_jabatan')->get(),
            'golongans' => Golongan::orderBy('kode_golongan')->get(),
            'ptkps' => DB::table('master_ptkps')->get(),
            'atasans' => Karyawan::where('status_aktif', true)->orderBy('nama_lengkap')->get(),
            // roles tidak perlu lagi dikirim ke view karena di-set default
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nik_internal' => 'required|string|max:50|unique:karyawans',
            'nama_lengkap' => 'required|string|max:150',
            'jenis_kelamin' => 'required|in:Laki-laki,Perempuan',
            'tempat_lahir' => 'required|string|max:100',
            'tgl_lahir' => 'required|date',
            'agama' => 'required|string|max:30',
            'status_pernikahan' => 'required|string|max:30',
            'alamat_ktp' => 'required|string',
            'alamat_domisili' => 'nullable|string', // PERBAIKAN 1: Diubah menjadi nullable
            'email_kantor' => 'required|email|unique:karyawans|unique:users,email',
            'no_telp' => 'nullable|string|max:20',
            'tgl_bergabung' => 'required|date',
            'departemen_id' => 'required|exists:departemens,id',
            'jabatan_id' => 'required|exists:jabatans,id',
            'golongan_id' => 'required|exists:golongans,id',
            'ptkp_id' => 'required|exists:master_ptkps,id',
            'atasan_id' => 'nullable|exists:karyawans,id', 
            'no_ktp' => 'required|string',
            'npwp' => 'nullable|string',
            'no_rek_bca' => 'nullable|string',
            'no_bpjs_kesehatan' => 'nullable|string',
            'no_bpjs_ketenagakerjaan' => 'nullable|string',
            'nama_kontak_darurat' => 'required|string|max:150',
            'no_telp_darurat' => 'required|string|max:20',
        ]);

        // PERBAIKAN 2: Logika Auto-Fill Alamat Domisili
        // Jika domisili dikosongkan oleh HRD, otomatis samakan isinya dengan Alamat KTP
        $alamatDomisili = $validated['alamat_domisili'] ?? $validated['alamat_ktp'];

        DB::beginTransaction();
        try {
            // Bypass Role: Otomatis diset ke 6 (Role Karyawan Staff)
            $user = User::create([
                'name' => $validated['nama_lengkap'],
                'username' => $validated['nik_internal'],
                'email' => $validated['email_kantor'],
                'password' => Hash::make($validated['nik_internal']), 
                'role_id' => 6, 
            ]);

            Karyawan::create([
                'user_id' => $user->id,
                'departemen_id' => $validated['departemen_id'],
                'jabatan_id' => $validated['jabatan_id'],
                'golongan_id' => $validated['golongan_id'],
                'ptkp_id' => $validated['ptkp_id'],
                'atasan_id' => $validated['atasan_id'] ?? null, 
                'nik_internal' => $validated['nik_internal'],
                'nama_lengkap' => $validated['nama_lengkap'],
                'jenis_kelamin' => $validated['jenis_kelamin'],
                'tempat_lahir' => $validated['tempat_lahir'],
                'tgl_lahir' => $validated['tgl_lahir'],
                'agama' => $validated['agama'],
                'status_pernikahan' => $validated['status_pernikahan'],
                'alamat_ktp' => $validated['alamat_ktp'],
                'alamat_domisili' => $alamatDomisili, // Menggunakan variabel auto-fill
                'email_kantor' => $validated['email_kantor'],
                'no_telp' => $validated['no_telp'] ?? null,
                'tgl_bergabung' => $validated['tgl_bergabung'],
                'no_ktp_encrypted' => Crypt::encryptString($validated['no_ktp']),
                'npwp_encrypted' => !empty($validated['npwp']) ? Crypt::encryptString($validated['npwp']) : null,
                'no_rek_bca_encrypted' => !empty($validated['no_rek_bca']) ? Crypt::encryptString($validated['no_rek_bca']) : null,
                'no_bpjs_kesehatan' => $validated['no_bpjs_kesehatan'] ?? null,
                'no_bpjs_ketenagakerjaan' => $validated['no_bpjs_ketenagakerjaan'] ?? null,
                'nama_kontak_darurat' => $validated['nama_kontak_darurat'],
                'no_telp_darurat' => $validated['no_telp_darurat'],
                'status_aktif' => true,
            ]);

            DB::commit();
            return redirect()->route('karyawan.index')->with('success', 'Karyawan berhasil didaftarkan dengan Role Default Karyawan!');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Gagal menyimpan data: ' . $e->getMessage()]);
        }
    }

    public function edit($id)
    {
        $karyawan = Karyawan::with('user')->findOrFail($id);

        // Gunakan Try-Catch agar sistem tidak crash jika bertemu data lama/dummy
        try { 
            $karyawan->no_ktp = Crypt::decryptString($karyawan->no_ktp_encrypted); 
        } catch (\Exception $e) { 
            $karyawan->no_ktp = ''; // Kosongkan jika gagal dekripsi
        }

        try { 
            $karyawan->npwp = $karyawan->npwp_encrypted ? Crypt::decryptString($karyawan->npwp_encrypted) : ''; 
        } catch (\Exception $e) { 
            $karyawan->npwp = ''; 
        }

        try { 
            $karyawan->no_rek_bca = $karyawan->no_rek_bca_encrypted ? Crypt::decryptString($karyawan->no_rek_bca_encrypted) : ''; 
        } catch (\Exception $e) { 
            $karyawan->no_rek_bca = ''; 
        }

        return Inertia::render('Kepegawaian/Karyawan/Edit', [
            'karyawan' => $karyawan,
            'departemens' => Departemen::orderBy('nama_departemen')->get(),
            'jabatans' => Jabatan::orderBy('nama_jabatan')->get(),
            'golongans' => Golongan::orderBy('kode_golongan')->get(),
            'ptkps' => DB::table('master_ptkps')->get(),
            'atasans' => Karyawan::where('status_aktif', true)->where('id', '!=', $id)->orderBy('nama_lengkap')->get(),
        ]);
    }

    public function update(Request $request, $id)
    {
        $karyawan = Karyawan::findOrFail($id);

        $validated = $request->validate([
            'nik_internal' => 'required|string|max:50|unique:karyawans,nik_internal,' . $karyawan->id,
            'nama_lengkap' => 'required|string|max:150',
            'jenis_kelamin' => 'required|in:Laki-laki,Perempuan',
            'tempat_lahir' => 'required|string|max:100',
            'tgl_lahir' => 'required|date',
            'agama' => 'required|string|max:30',
            'status_pernikahan' => 'required|string|max:30',
            'alamat_ktp' => 'required|string',
            'alamat_domisili' => 'required|string',
            'email_kantor' => 'required|email|unique:karyawans,email_kantor,' . $karyawan->id,
            'no_telp' => 'nullable|string|max:20',
            'tgl_bergabung' => 'required|date',
            'departemen_id' => 'required|exists:departemens,id',
            'jabatan_id' => 'required|exists:jabatans,id',
            'golongan_id' => 'required|exists:golongans,id',
            'ptkp_id' => 'required|exists:master_ptkps,id',
            'atasan_id' => 'nullable|exists:karyawans,id|different:id',
            'no_ktp' => 'required|string',
            'npwp' => 'nullable|string',
            'no_rek_bca' => 'nullable|string',
            'no_bpjs_kesehatan' => 'nullable|string',
            'no_bpjs_ketenagakerjaan' => 'nullable|string',
            'nama_kontak_darurat' => 'required|string|max:150',
            'no_telp_darurat' => 'required|string|max:20',
            'status_aktif' => 'required|boolean',
        ]);

        // GATEKEEPER EXIT CLEARANCE
        if ($karyawan->status_aktif == true && $validated['status_aktif'] == false) {
            $asetDitahan = \App\Models\Aset::where('penanggung_jawab_id', $id)->where('status', 'Dipakai')->count();
            $hutangKasbon = \App\Models\PinjamanKaryawan::where('karyawan_id', $id)->whereIn('status', ['Pending', 'Menunggu Pencairan', 'Menunggu Approval Direktur', 'Berjalan'])->count();

            if ($asetDitahan > 0 || $hutangKasbon > 0) {
                return back()->withErrors([
                    'error' => "EXIT CLEARANCE DITOLAK: Karyawan ini tidak bisa dinon-aktifkan karena masih memegang {$asetDitahan} Aset Perusahaan dan memiliki {$hutangKasbon} tunggakan Kasbon. Lakukan serah terima aset dan pelunasan di Finance terlebih dahulu!"
                ]);
            }
        }

        DB::beginTransaction();
        try {
            // Update akun user tapi HINDARI mengubah role_id
            $user = User::findOrFail($karyawan->user_id);
            $user->update([
                'name' => $validated['nama_lengkap'],
                'username' => $validated['nik_internal'],
                'email' => $validated['email_kantor'],
            ]);

            $karyawan->update([
                'departemen_id' => $validated['departemen_id'],
                'jabatan_id' => $validated['jabatan_id'],
                'golongan_id' => $validated['golongan_id'],
                'ptkp_id' => $validated['ptkp_id'],
                'atasan_id' => $validated['atasan_id'],
                'nik_internal' => $validated['nik_internal'],
                'nama_lengkap' => $validated['nama_lengkap'],
                'jenis_kelamin' => $validated['jenis_kelamin'],
                'tempat_lahir' => $validated['tempat_lahir'],
                'tgl_lahir' => $validated['tgl_lahir'],
                'agama' => $validated['agama'],
                'status_pernikahan' => $validated['status_pernikahan'],
                'alamat_ktp' => $validated['alamat_ktp'],
                'alamat_domisili' => $validated['alamat_domisili'],
                'email_kantor' => $validated['email_kantor'],
                'no_telp' => $validated['no_telp'],
                'tgl_bergabung' => $validated['tgl_bergabung'],
                'no_ktp_encrypted' => Crypt::encryptString($validated['no_ktp']),
                'npwp_encrypted' => $validated['npwp'] ? Crypt::encryptString($validated['npwp']) : null,
                'no_rek_bca_encrypted' => $validated['no_rek_bca'] ? Crypt::encryptString($validated['no_rek_bca']) : null,
                'no_bpjs_kesehatan' => $validated['no_bpjs_kesehatan'],
                'no_bpjs_ketenagakerjaan' => $validated['no_bpjs_ketenagakerjaan'],
                'nama_kontak_darurat' => $validated['nama_kontak_darurat'],
                'no_telp_darurat' => $validated['no_telp_darurat'],
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
        $karyawan = Karyawan::findOrFail($id);
        
        $asetDitahan = \App\Models\Aset::where('penanggung_jawab_id', $id)->count();
        $hutangKasbon = \App\Models\PinjamanKaryawan::where('karyawan_id', $id)
            ->whereIn('status', ['Pending', 'Menunggu Pencairan', 'Menunggu Approval Direktur', 'Berjalan'])
            ->count();

        if ($asetDitahan > 0 || $hutangKasbon > 0) {
            return back()->withErrors([
                'error' => "PENGHAPUSAN DITOLAK: Karyawan ini masih terikat dengan {$asetDitahan} Aset Perusahaan dan {$hutangKasbon} tunggakan Kasbon."
            ]);
        }

        DB::beginTransaction();
        try {
            $userId = $karyawan->user_id;
            $karyawan->delete();
            User::where('id', $userId)->delete(); 

            DB::commit();
            return redirect()->route('karyawan.index')->with('success', 'Karyawan dan akun loginnya berhasil dihapus.');
        } catch (\Illuminate\Database\QueryException $e) {
            DB::rollBack();
            return back()->withErrors([
                'error' => 'SISTEM MENOLAK: Karyawan ini tidak dapat dihapus karena sudah memiliki riwayat transaksi (Absensi/Cuti/SPJ/Lembur) di sistem. Silakan Edit dan ubah statusnya menjadi "NON-AKTIF" sebagai gantinya.'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Gagal menghapus data: ' . $e->getMessage()]);
        }
    }

    public function show($id)
    {
        // Tambahan: 'dokumens' diload agar berkas KTP/Ijazah tampil di profil
        $karyawan = Karyawan::with([
            'departemen', 'jabatan', 'golongan', 'user', 'atasan',
            'riwayatGajis', 'riwayatJabatans.jabatan', 'dokumens'
        ])->findOrFail($id);

        $bawahans = Karyawan::with('jabatan')
            ->where('atasan_id', $id)
            ->where('status_aktif', true)
            ->get();

        try { $karyawan->no_ktp = Crypt::decryptString($karyawan->no_ktp_encrypted); } catch (\Exception $e) { $karyawan->no_ktp = 'Format Enkripsi Tidak Valid'; }
        try { $karyawan->npwp = $karyawan->npwp_encrypted ? Crypt::decryptString($karyawan->npwp_encrypted) : '-'; } catch (\Exception $e) { $karyawan->npwp = 'Format Enkripsi Tidak Valid'; }
        try { $karyawan->no_rek_bca = $karyawan->no_rek_bca_encrypted ? Crypt::decryptString($karyawan->no_rek_bca_encrypted) : '-'; } catch (\Exception $e) { $karyawan->no_rek_bca = 'Format Enkripsi Tidak Valid'; }

        return Inertia::render('Kepegawaian/Karyawan/Show', [
            'karyawan' => $karyawan,
            'jabatans' => Jabatan::orderBy('nama_jabatan')->get(),
            'bawahans' => $bawahans, 
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

    // ====================================================================
    // FITUR BARU: MANAJEMEN UPLOAD DOKUMEN KARYAWAN
    // ====================================================================
    
    public function uploadDokumen(Request $request, $id)
    {
        $request->validate([
            'jenis_dokumen' => 'required|string|max:100',
            'nama_dokumen' => 'required|string|max:255',
            'file_dokumen' => 'required|file|mimes:pdf,jpg,jpeg,png|max:5120', // Maks 5MB
        ]);

        try {
            $karyawan = Karyawan::findOrFail($id);
            
            if ($request->hasFile('file_dokumen')) {
                $file = $request->file('file_dokumen');
                // Format Nama File: NIK_JenisDokumen_Timestamp.ext
                $fileName = $karyawan->nik_internal . '_' . str_replace(' ', '', $request->jenis_dokumen) . '_' . time() . '.' . $file->getClientOriginalExtension();
                
                // Simpan ke storage/app/public/dokumen_karyawan
                $filePath = $file->storeAs('dokumen_karyawan', $fileName, 'public');

                DokumenKaryawan::create([
                    'karyawan_id' => $karyawan->id,
                    'jenis_dokumen' => $request->jenis_dokumen,
                    'nama_dokumen' => $request->nama_dokumen,
                    'file_path' => '/storage/' . $filePath,
                ]);

                return back()->with('success', 'Dokumen berhasil diunggah.');
            }
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Gagal mengunggah dokumen: ' . $e->getMessage()]);
        }
    }

    public function deleteDokumen($karyawanId, $dokumenId)
    {
        try {
            $dokumen = DokumenKaryawan::where('karyawan_id', $karyawanId)->findOrFail($dokumenId);
            
            // Hapus file fisik dari server
            $pathParts = explode('/storage/', $dokumen->file_path);
            if (isset($pathParts[1])) {
                Storage::disk('public')->delete($pathParts[1]);
            }

            // Hapus data dari database
            $dokumen->delete();

            return back()->with('success', 'Dokumen berhasil dihapus.');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Gagal menghapus dokumen: ' . $e->getMessage()]);
        }
    }

    public function uploadFotoProfil(Request $request, $id)
    {
        $request->validate([
            'foto_profil' => 'required|image|mimes:jpg,jpeg,png|max:2048', // Maks 2MB, wajib gambar
        ]);

        try {
            $karyawan = Karyawan::findOrFail($id);
            
            if ($request->hasFile('foto_profil')) {
                // Jika sudah punya foto sebelumnya, hapus foto lama agar server tidak penuh
                if ($karyawan->foto_profil) {
                    $oldPhotoPath = str_replace('/storage/', '', $karyawan->foto_profil);
                    Storage::disk('public')->delete($oldPhotoPath);
                }

                $file = $request->file('foto_profil');
                $fileName = 'avatar_' . $karyawan->nik_internal . '_' . time() . '.' . $file->getClientOriginalExtension();
                
                // Simpan ke folder public/profil_karyawan
                $filePath = $file->storeAs('profil_karyawan', $fileName, 'public');

                // Update database
                $karyawan->update([
                    'foto_profil' => '/storage/' . $filePath
                ]);

                return back()->with('success', 'Foto profil berhasil diperbarui.');
            }
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Gagal mengunggah foto: ' . $e->getMessage()]);
        }
    }
}