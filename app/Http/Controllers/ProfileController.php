<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Tampilkan halaman Profil ESS (Employee Self-Service)
     */
    public function edit(Request $request): Response
    {
        // 1. Ambil data user beserta relasi Karyawan-nya (untuk ditampilkan sebagai Read-Only)
        // Pastikan model User sudah memiliki relasi public function karyawan()
        $user = $request->user()->load([
            'karyawan.departemen', 
            'karyawan.jabatan', 
            'karyawan.atasan', 
            'karyawan.golongan'
        ]);

        return Inertia::render('Profile/Edit', [
            'status' => session('status'),
            'user' => $user,
            // Kita kirimkan objek karyawan secara terpisah agar mudah dipanggil di React
            'karyawan' => $user->karyawan, 
        ]);
    }

    /**
     * Update data Tier 1 (Hanya data yang diizinkan untuk diubah Karyawan)
     */
    public function update(Request $request): RedirectResponse
    {
        // 2. Validasi HANYA untuk kolom Tier 1
        $validated = $request->validate([
            'no_telp' => 'nullable|string|max:20',
            'alamat_domisili' => 'nullable|string',
            'nama_kontak_darurat' => 'required|string|max:150',
            'no_telp_darurat' => 'required|string|max:20',
        ]);

        $karyawan = $request->user()->karyawan;

        if ($karyawan) {
            // Update data di tabel karyawans
            $karyawan->update($validated);
        }

        return Redirect::route('profile.edit')->with('success', 'Data profil berhasil diperbarui.');
    }

    /**
     * Fitur Khusus: Upload Foto Profil Karyawan (Self-Service)
     */
    public function updateFoto(Request $request): RedirectResponse
    {
        $request->validate([
            'foto_profil' => 'required|image|mimes:jpg,jpeg,png|max:2048',
        ]);

        $karyawan = $request->user()->karyawan;

        if ($karyawan && $request->hasFile('foto_profil')) {
            // Hapus foto lama jika ada
            if ($karyawan->foto_profil) {
                $oldPhotoPath = str_replace('/storage/', '', $karyawan->foto_profil);
                Storage::disk('public')->delete($oldPhotoPath);
            }

            $file = $request->file('foto_profil');
            $fileName = 'avatar_' . $karyawan->nik_internal . '_' . time() . '.' . $file->getClientOriginalExtension();
            
            // Simpan ke folder yang sama dengan HRD
            $filePath = $file->storeAs('profil_karyawan', $fileName, 'public');

            $karyawan->update([
                'foto_profil' => '/storage/' . $filePath
            ]);
        }

        return Redirect::route('profile.edit')->with('success', 'Foto profil berhasil diperbarui.');
    }

    /**
     * BLOKIR FITUR HAPUS AKUN (Keamanan HRIS)
     */
    public function destroy(Request $request): RedirectResponse
    {
        // Karyawan TIDAK BOLEH bisa menghapus akun perusahaan mereka sendiri
        // Kita timpa fungsi bawaan Breeze dengan pesan error
        return back()->withErrors(['error' => 'Aksi ditolak. Karyawan tidak diizinkan menghapus akun sistem. Silakan hubungi HRD.']);
    }
}