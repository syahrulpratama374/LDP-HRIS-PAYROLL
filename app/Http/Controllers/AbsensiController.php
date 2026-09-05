<?php

namespace App\Http\Controllers;

use App\Models\Absensi;
use App\Models\Pengaturan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;
use Inertia\Inertia;

class AbsensiController extends Controller
{
    public function index()
    {
        $absensis = Absensi::with(['karyawan.departemen', 'karyawan.jabatan'])
            ->orderBy('tanggal', 'desc')
            ->orderBy('waktu_masuk', 'desc')
            ->paginate(15);

        return inertia('Kepegawaian/Absensi/Index', [
            'absensis' => $absensis
        ]);
    }

    public function create()
    {
        $user = Auth::user();
        $karyawan = $user->karyawan;

        if (!$karyawan) {
            abort(403, 'Akses Ditolak: Halaman absensi ini khusus untuk Karyawan. Akun Anda tidak terikat dengan profil kepegawaian mana pun.');
        }

        $hariIni = Carbon::today('Asia/Jakarta')->toDateString();

        $absensiHariIni = Absensi::where('karyawan_id', $karyawan->id)
            ->where('tanggal', $hariIni)
            ->first();

        return Inertia::render('Kepegawaian/Absensi/Create', [
            'absensiHariIni' => $absensiHariIni,
            'karyawan' => $karyawan
        ]);
    }

    public function store(Request $request)
    {
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

        $waktuSekarang = Carbon::now('Asia/Jakarta');
        $tanggal = $waktuSekarang->toDateString();

        // --- MULAI BLOK VALIDASI GEOFENCING (RADIUS GPS) ---
        // 1. Ambil Pengaturan dari Database
        $titikKantor = Pengaturan::where('kunci', 'koordinat_kantor')->value('nilai');
        $radiusMaksimal = (int) Pengaturan::where('kunci', 'radius_absensi')->value('nilai');
        
        // 2. Pecah koordinat kantor dan user menjadi Latitude & Longitude
        $koorKantor = explode(',', str_replace(' ', '', $titikKantor));
        $koorUser = explode(',', str_replace(' ', '', $request->koordinat));
        
        // 3. Hitung Jarak
        $jarakMeter = $this->hitungJarakMeter(
            (float) $koorKantor[0], (float) $koorKantor[1], 
            (float) $koorUser[0], (float) $koorUser[1]
        );

        // 4. Simulasi Cek SPJ (Bypass Radius)
        $sedangSPJ = false; // Nanti dihubungkan ke model PengajuanSpj

        // 5. Tolak jika di luar radius (dan tidak sedang SPJ)
        if (!$sedangSPJ && $jarakMeter > $radiusMaksimal) {
            return back()->withErrors(['error' => "Gagal: Anda di luar jangkauan kantor. Jarak Anda " . round($jarakMeter) . "m (Batas: {$radiusMaksimal}m)."]);
        }
        // --- SELESAI BLOK VALIDASI GEOFENCING ---


        // --- MULAI BLOK PROSES GAMBAR BASE64 ---
        $image_parts = explode(";base64,", $request->image);
        $image_base64 = base64_decode($image_parts[1]);

        $fileName = $karyawan->id . '_' . $request->tipe . '_' . $waktuSekarang->format('Ymd_His') . '.jpg';
        $filePath = 'absensi/' . $fileName;

        Storage::disk('public')->put($filePath, $image_base64);
        // --- SELESAI BLOK PROSES GAMBAR ---


        $absensi = Absensi::where('karyawan_id', $karyawan->id)->where('tanggal', $tanggal)->first();

        // LOGIKA CLOCK IN (MASUK)
        if ($request->tipe === 'masuk') {
            if ($absensi) return back()->withErrors(['error' => 'Anda sudah melakukan Clock In hari ini.']);

            // Validasi Keterlambatan
            $jamMasukStandar = Pengaturan::where('kunci', 'jam_masuk_operasional')->value('nilai');
            $toleransiMenit = (int) Pengaturan::where('kunci', 'toleransi_keterlambatan')->value('nilai');
            
            $batasWaktuMasuk = Carbon::parse($tanggal . ' ' . $jamMasukStandar, 'Asia/Jakarta')->addMinutes($toleransiMenit);
            
            $status = 'Hadir';
            $catatan = null;

            if ($sedangSPJ) {
                $status = 'Dinas Luar';
                $catatan = 'Bypass Radius: SPJ Aktif';
            } elseif ($waktuSekarang->greaterThan($batasWaktuMasuk)) {
                $status = 'Terlambat';
                $selisih = $batasWaktuMasuk->diffInMinutes($waktuSekarang);
                $catatan = "Terlambat {$selisih} menit";
            }

            Absensi::create([
                'karyawan_id' => $karyawan->id,
                'tanggal' => $tanggal,
                'waktu_masuk' => $waktuSekarang,
                'koordinat_masuk' => $request->koordinat,
                'foto_masuk_path' => $filePath,
                'status' => $status,
                'catatan' => $catatan
            ]);
            
            return back()->with('success', 'Clock In berhasil! Status: ' . $status);
        } 
        
        // LOGIKA CLOCK OUT (KELUAR)
        else if ($request->tipe === 'keluar') {
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

    /**
     * Menghitung Jarak GPS menggunakan Haversine Formula
     */
    private function hitungJarakMeter($lat1, $lon1, $lat2, $lon2)
    {
        $earthRadius = 6371000; 
        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);

        $a = sin($dLat / 2) * sin($dLat / 2) +
             cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
             sin($dLon / 2) * sin($dLon / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));
        $distance = $earthRadius * $c;

        return $distance;
    }
}