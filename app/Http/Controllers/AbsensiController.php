<?php

namespace App\Http\Controllers;

use App\Models\Absensi;
use App\Models\Pengaturan;
use App\Models\PengajuanSpj;
use App\Models\LogbookShift;
use App\Models\MasterShift;
use App\Models\JadwalShiftKaryawan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;
use Inertia\Inertia;

class AbsensiController extends Controller
{
    public function index(Request $request)
    {
        $tanggal = $request->input('tanggal', Carbon::today('Asia/Jakarta')->toDateString());
        $departemenId = $request->input('departemen_id');
        $search = $request->input('search');

        // 1. Base Query Seluruh Karyawan Aktif
        $query = \App\Models\Karyawan::with([
            'departemen',
            'jabatan',
            'user.role',
            'absensis' => function ($q) use ($tanggal) {
                $q->where('tanggal', $tanggal);
            }
        ])->where('status_aktif', true);

        if ($departemenId) {
            $query->where('departemen_id', $departemenId);
        }

        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('nama_lengkap', 'like', "%{$search}%")
                  ->orWhere('nik_internal', 'like', "%{$search}%");
            });
        }

        $karyawans = $query->orderBy('nama_lengkap')->get();

        // 2. Data SPJ Aktif (Dinas Luar)
        $spjKaryawanIds = \App\Models\PengajuanSpj::where('status_approval', 'Selesai')
            ->where('tgl_mulai', '<=', $tanggal)
            ->where('tgl_selesai', '>=', $tanggal)
            ->pluck('karyawan_id')
            ->toArray();

        // 3. Data Cuti/Izin Approved (Fallback jika record absensi belum terinjeksi)
        $cutiKaryawan = \App\Models\PengajuanCuti::with('masterJenisCuti')
            ->where('status_approval', 'Disetujui')
            ->where('tanggal_mulai', '<=', $tanggal)
            ->where('tanggal_selesai', '>=', $tanggal)
            ->get()
            ->keyBy('karyawan_id');

        // 4. Data Lembur Approved pada Tanggal Ini
        $lemburKaryawan = \App\Models\PengajuanLembur::where('status_approval', 'Disetujui')
            ->where('tanggal', $tanggal)
            ->get()
            ->keyBy('karyawan_id');

        // 5. Olah Status Kehadiran Karyawan
        $processed = $karyawans->map(function ($karyawan) use ($tanggal, $spjKaryawanIds, $cutiKaryawan, $lemburKaryawan) {
            $absensi = $karyawan->absensis->first();
            $isSPJ = in_array($karyawan->id, $spjKaryawanIds);
            $dataCuti = $cutiKaryawan->get($karyawan->id);
            $dataLembur = $lemburKaryawan->get($karyawan->id);

            $statusAbsensi = 'Belum Absen';
            $menitTerlambat = 0;
            $catatan = null;

            // Format Data Lembur (jika ada SPL disetujui)
            $infoLembur = null;
            if ($dataLembur) {
                $infoLembur = [
                    'jam_mulai' => Carbon::parse($dataLembur->jam_mulai)->format('H:i'),
                    'jam_selesai' => Carbon::parse($dataLembur->jam_selesai)->format('H:i'),
                    'deskripsi' => $dataLembur->deskripsi_pekerjaan
                ];
            }

            if ($absensi) {
                $catatan = $absensi->catatan;

                if ($absensi->status === 'Cuti') {
                    $statusAbsensi = 'Cuti / Izin';
                } elseif ($absensi->status === 'Dinas Luar') {
                    $statusAbsensi = 'Dinas Luar';
                } elseif ($absensi->status === 'Terlambat') {
                    $statusAbsensi = 'Terlambat';
                    if (preg_match('/Terlambat ([\d\.]+) menit/i', $absensi->catatan ?? '', $matches)) {
                        $menitTerlambat = (int) round((float) $matches[1]);
                        $catatan = str_replace($matches[0], "Terlambat {$menitTerlambat} menit", $catatan);
                    }
                } else {
                    $statusAbsensi = 'Tepat Waktu';
                }
            } elseif ($isSPJ) {
                $statusAbsensi = 'Dinas Luar';
            } elseif ($dataCuti) {
                $statusAbsensi = 'Cuti / Izin';
                $namaJenis = $dataCuti->masterJenisCuti ? $dataCuti->masterJenisCuti->nama_cuti : 'Cuti';
                $catatan = 'Cuti: ' . $namaJenis;
            }

            return [
                'id' => $karyawan->id,
                'nik_internal' => $karyawan->nik_internal,
                'nama_lengkap' => $karyawan->nama_lengkap,
                'departemen' => $karyawan->departemen ? $karyawan->departemen->nama_departemen : '-',
                'jabatan' => $karyawan->jabatan ? $karyawan->jabatan->nama_jabatan : '-',
                'role' => $karyawan->user && $karyawan->user->role ? $karyawan->user->role->nama_role : 'Staff',
                'status_absensi' => $statusAbsensi,
                'waktu_masuk' => $absensi ? $absensi->waktu_masuk : null,
                'waktu_keluar' => $absensi ? $absensi->waktu_keluar : null,
                'foto_masuk' => $absensi ? $absensi->foto_masuk_path : null,
                'foto_keluar' => $absensi ? $absensi->foto_keluar_path : null,
                'koordinat_masuk' => $absensi ? $absensi->koordinat_masuk : null,
                'menit_terlambat' => $menitTerlambat,
                'catatan' => $catatan,
                'info_lembur' => $infoLembur,
                'has_absensi' => !is_null($absensi)
            ];
        });

        // Rekapitulasi Statistik Stat Cards
        $stats = [
            'total_karyawan' => $processed->count(),
            'tepat_waktu' => $processed->where('status_absensi', 'Tepat Waktu')->count(),
            'terlambat' => $processed->where('status_absensi', 'Terlambat')->count(),
            'total_menit_terlambat' => $processed->sum('menit_terlambat'),
            'dinas_luar' => $processed->where('status_absensi', 'Dinas Luar')->count(),
            'cuti_izin' => $processed->where('status_absensi', 'Cuti / Izin')->count(),
            'belum_absen' => $processed->where('status_absensi', 'Belum Absen')->count(),
            'total_lembur' => $processed->whereNotNull('info_lembur')->count(),
        ];

        return Inertia::render('Kepegawaian/Absensi/Index', [
            'absensiList' => $processed->values(),
            'stats' => $stats,
            'filters' => [
                'tanggal' => $tanggal,
                'departemen_id' => $departemenId ?? '',
                'search' => $search ?? ''
            ],
            'departemens' => \App\Models\Departemen::orderBy('nama_departemen')->get(['id', 'nama_departemen'])
        ]);
    }

    public function create()
    {
        $user = Auth::user();
        $karyawan = $user->karyawan;

        if ($user->role_id === 1 && !$karyawan) {
            abort(403, 'Super Admin tidak diwajibkan melakukan absensi harian.');
        }

        if (!$karyawan) {
            abort(403, 'Profil Karyawan Anda belum terdaftar. Silakan hubungi bagian HC.');
        }

        $hariIni = Carbon::today('Asia/Jakarta')->toDateString();

        $absensiHariIni = Absensi::where('karyawan_id', $karyawan->id)
            ->where('tanggal', $hariIni)
            ->first();

        // Ambil data shift untuk ditampilkan di dropdown (Khusus departemen NOC / Wajib Logbook)
        $shifts = [];
        $scheduledShiftId = null;
        $isNoc = $karyawan->departemen && $karyawan->departemen->is_wajib_logbook;

        if ($isNoc) {
            $shifts = MasterShift::orderBy('jam_masuk')->get();

            // Auto-detect apakah HC sudah membuatkan jadwal shift untuk karyawan ini pada hari ini
            $jadwalRoster = JadwalShiftKaryawan::where('karyawan_id', $karyawan->id)
                ->where('tanggal', $hariIni)
                ->first();

            if ($jadwalRoster) {
                $scheduledShiftId = $jadwalRoster->shift_id;
            }
        }

        return Inertia::render('Kepegawaian/Absensi/Create', [
            'absensiHariIni' => $absensiHariIni,
            'karyawan' => $karyawan,
            'shifts' => $shifts,
            'isNoc' => $isNoc,
            'scheduledShiftId' => $scheduledShiftId // ID shift otomatis yang dikunci jika roster sudah ada
        ]);
    }

    public function store(Request $request)
    {
        $user = Auth::user();
        $karyawan = $user->karyawan;

        if ($user->role_id === 1 && !$karyawan) {
            return back()->withErrors(['error' => 'Super Admin tidak diwajibkan melakukan absensi harian.']);
        }
        if (!$karyawan) {
            return back()->withErrors(['error' => 'Akses Ditolak: Akun Anda belum terhubung dengan data profil Karyawan.']);
        }

        $request->validate([
            'image' => 'required|string',
            'koordinat' => 'required|string',
            'tipe' => 'required|in:masuk,keluar',
            'catatan_logbook' => 'nullable|string|max:500',
            'shift_id' => 'nullable|exists:master_shifts,id'
        ]);

        $waktuSekarang = Carbon::now('Asia/Jakarta');
        $tanggal = $waktuSekarang->toDateString();

        // --- VALIDASI GEOFENCING ---
        $titikKantor = Pengaturan::where('kunci', 'koordinat_kantor')->value('nilai') ?? '-7.8014,110.3644';
        $radiusMaksimal = (int) (Pengaturan::where('kunci', 'radius_absensi')->value('nilai') ?? 50);
        
        $koorKantor = explode(',', str_replace(' ', '', $titikKantor));
        $koorUser = explode(',', str_replace(' ', '', $request->koordinat));
        
        $jarakMeter = $this->hitungJarakMeter(
            (float) $koorKantor[0], (float) $koorKantor[1], 
            (float) $koorUser[0], (float) $koorUser[1]
        );

        $sedangSPJ = PengajuanSpj::where('karyawan_id', $karyawan->id)
            ->where('status_approval', 'Selesai')
            ->where('tgl_mulai', '<=', $tanggal)
            ->where('tgl_selesai', '>=', $tanggal)
            ->exists();

        if (!$sedangSPJ && $jarakMeter > $radiusMaksimal) {
            return back()->withErrors(['error' => "Gagal: Anda di luar jangkauan kantor. Jarak Anda " . round($jarakMeter) . "m (Batas: {$radiusMaksimal}m)."]);
        }

        // --- PROSES GAMBAR ---
        $image_parts = explode(";base64,", $request->image);
        $image_base64 = base64_decode($image_parts[1]);
        $fileName = $karyawan->id . '_' . $request->tipe . '_' . $waktuSekarang->format('Ymd_His') . '.jpg';
        $filePath = 'absensi/' . $fileName;
        Storage::disk('public')->put($filePath, $image_base64);

        $absensi = Absensi::where('karyawan_id', $karyawan->id)->where('tanggal', $tanggal)->first();
        $isNoc = $karyawan->departemen && $karyawan->departemen->is_wajib_logbook;

        // ==============================================================
        // LOGIKA CLOCK IN (MASUK)
        // ==============================================================
        if ($request->tipe === 'masuk') {
            if ($absensi) return back()->withErrors(['error' => 'Anda sudah melakukan Clock In hari ini.']);

            // Default pengaturan absensi staf reguler
            $jamMasukStandar = Pengaturan::where('kunci', 'jam_masuk_operasional')->value('nilai') ?? '08:00';
            $toleransiMenit = (int) (Pengaturan::where('kunci', 'toleransi_keterlambatan')->value('nilai') ?? 15);
            $namaShift = 'Reguler';

            // JIKA DIA TIM NOC, PROSES SHIFT-NYA
            if ($isNoc) {
                // Utamakan Jadwal Roster dari DB jika ada, untuk mencegah kecurangan API
                $jadwalRoster = JadwalShiftKaryawan::where('karyawan_id', $karyawan->id)
                    ->where('tanggal', $tanggal)
                    ->first();

                $shiftIdDigunakan = $jadwalRoster ? $jadwalRoster->shift_id : $request->shift_id;

                if (!$shiftIdDigunakan) {
                    return back()->withErrors(['error' => 'Tim Operasional/NOC wajib memilih Jam Shift saat Clock In.']);
                }
                
                $shiftAktif = MasterShift::find($shiftIdDigunakan);
                $jamMasukStandar = $shiftAktif->jam_masuk;
                $namaShift = $shiftAktif->nama_shift;
            }
            
            // Kalkulasi Keterlambatan
            $batasWaktuMasuk = Carbon::parse($tanggal . ' ' . $jamMasukStandar, 'Asia/Jakarta')->addMinutes($toleransiMenit);
            
            $status = 'Hadir';
            $catatan = $namaShift;

            if ($sedangSPJ) {
                $status = 'Dinas Luar';
                $catatan .= ' | Bypass Radius: SPJ Aktif';
            } elseif ($waktuSekarang->greaterThan($batasWaktuMasuk)) {
                $status = 'Terlambat';
                $selisih = (int) round($batasWaktuMasuk->diffInMinutes($waktuSekarang));
                $catatan .= " | Terlambat {$selisih} menit";
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
        
        // ==============================================================
        // LOGIKA CLOCK OUT (KELUAR)
        // ==============================================================
        else if ($request->tipe === 'keluar') {
            if (!$absensi) return back()->withErrors(['error' => 'Anda belum melakukan Clock In.']);
            if ($absensi->waktu_keluar) return back()->withErrors(['error' => 'Anda sudah melakukan Clock Out hari ini.']);

            $catatanKeluar = $absensi->catatan;
            
            if ($request->filled('catatan_logbook')) {
                $tambahanLogbook = 'Handover: ' . $request->catatan_logbook;
                $catatanKeluar = $catatanKeluar ? $catatanKeluar . ' | ' . $tambahanLogbook : $tambahanLogbook;

                // SIMPAN KE LOGBOOK
                if ($isNoc && $request->shift_id) {
                    LogbookShift::create([
                        'karyawan_id' => $karyawan->id,
                        'shift_id' => $request->shift_id,
                        'tanggal' => $tanggal,
                        'catatan_handover' => $request->catatan_logbook,
                    ]);
                }
            }

            $absensi->update([
                'waktu_keluar' => $waktuSekarang,
                'koordinat_keluar' => $request->koordinat,
                'foto_keluar_path' => $filePath,
                'catatan' => $catatanKeluar
            ]);

            return back()->with('success', 'Clock Out berhasil dicatat! Selamat beristirahat.');
        }
    }

    // PERBAIKAN RUMUS MATEMATIKA HAVERSINE (Jarak Meter)
    private function hitungJarakMeter($lat1, $lon1, $lat2, $lon2)
    {
        $earthRadius = 6371000; 
        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);

        $a = sin($dLat / 2) * sin($dLat / 2) +
             cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
             sin($dLon / 2) * sin($dLon / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));
        return $earthRadius * $c;
    }
}