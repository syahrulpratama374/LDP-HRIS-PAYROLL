<?php

namespace App\Http\Controllers;

use App\Models\Absensi;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;
use Inertia\Inertia;

class AbsensiController extends Controller
{
    // Menampilkan Halaman Dasbor Absensi Karyawan
    // Menampilkan Halaman Dasbor Absensi Karyawan
    public function index()
    {
        // Mengambil semua data absensi, diurutkan dari yang terbaru
        $absensis = \App\Models\Absensi::with(['karyawan.departemen', 'karyawan.jabatan'])
            ->orderBy('tanggal', 'desc')
            ->orderBy('waktu_masuk', 'desc')
            ->paginate(15);

        return inertia('Kepegawaian/Absensi/Index', [
            'absensis' => $absensis
        ]);
    }
    public function create()
    {
        // 1. Ambil data user yang sedang login
        $user = Auth::user();
        $karyawan = $user->karyawan;

        // 2. Proteksi (Null Check): Jika yang login BUKAN karyawan (misal: Admin), blokir aksesnya
        if (!$karyawan) {
            abort(403, 'Akses Ditolak: Halaman absensi ini khusus untuk Karyawan. Akun Anda tidak terikat dengan profil kepegawaian mana pun.');
        }

        $hariIni = Carbon::today()->toDateString();

        $absensiHariIni = Absensi::where('karyawan_id', $karyawan->id)
            ->where('tanggal', $hariIni)
            ->first();

        return Inertia::render('Kepegawaian/Absensi/Create', [
            'absensiHariIni' => $absensiHariIni,
            'karyawan' => $karyawan
        ]);
    }

    // Memproses Data Clock In & Clock Out
    public function store(Request $request)
    {
        // 1. Proteksi (Null Check) juga di saat proses simpan
        $user = Auth::user();
        $karyawan = $user->karyawan;

        if (!$karyawan) {
            return back()->withErrors(['error' => 'Akses Ditolak: Akun Anda tidak memiliki profil karyawan.']);
        }

        $request->validate([
            'image' => 'required|string',
            'koordinat' => 'required|string',
            'tipe' => 'required|in:masuk,keluar'
        ]);

        $waktuSekarang = Carbon::now();
        $tanggal = $waktuSekarang->toDateString();

        // ... (Kode proses gambar Base64 dan logika Clock In/Out di bawahnya tetap sama seperti sebelumnya) ...
        $image_parts = explode(";base64,", $request->image);
        $image_base64 = base64_decode($image_parts[1]);

        $fileName = $karyawan->id . '_' . $request->tipe . '_' . $waktuSekarang->format('Ymd_His') . '.jpg';
        $filePath = 'absensi/' . $fileName;

        Storage::disk('public')->put($filePath, $image_base64);

        $absensi = Absensi::where('karyawan_id', $karyawan->id)->where('tanggal', $tanggal)->first();

        if ($request->tipe === 'masuk') {
            if ($absensi) return back()->withErrors(['error' => 'Anda sudah melakukan Clock In hari ini.']);

            Absensi::create([
                'karyawan_id' => $karyawan->id,
                'tanggal' => $tanggal,
                'waktu_masuk' => $waktuSekarang,
                'koordinat_masuk' => $request->koordinat,
                'foto_masuk_path' => $filePath,
                // 'status_kehadiran' => 'Hadir'
            ]);
            return back()->with('success', 'Clock In berhasil dicatat!');
        } else if ($request->tipe === 'keluar') {
            if (!$absensi) return back()->withErrors(['error' => 'Anda belum melakukan Clock In.']);
            if ($absensi->waktu_keluar) return back()->withErrors(['error' => 'Anda sudah melakukan Clock Out hari ini.']);

            $absensi->update([
                'waktu_keluar' => $waktuSekarang,
                'koordinat_keluar' => $request->koordinat,
                'foto_keluar_path' => $filePath,
            ]);
            return back()->with('success', 'Clock Out berhasil dicatat! Selamat beristirahat.');
        }
    }
}
