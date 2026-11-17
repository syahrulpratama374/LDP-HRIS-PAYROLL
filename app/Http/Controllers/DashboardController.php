<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Absensi;
use App\Models\Karyawan;
use App\Models\PengajuanCuti;
use App\Models\PengajuanLembur;
use App\Models\PengajuanSpj;
use App\Models\SaldoCuti;
use App\Models\MasterJenisCuti;
use App\Models\PinjamanKaryawan;
use App\Models\Payroll;
use App\Models\Departemen;
use App\Models\DetailPayroll;
use App\Http\Middleware\DynamicRolePermission;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $roleId = $user->role_id ?? 6;

        // --- 1. HITUNG DATA DINAMIS SELF-SERVICE (Untuk Semua Role: Karyawan, SPV, dll.) ---
        $sisaCuti = 0;
        $hakCutiTahunan = 0;
        $cutiTerpakai = 0;
        $sisaKasbon = 5000000;

        $karyawan = $user->karyawan;
        if ($karyawan) {
            $tahunIni = date('Y');

            // Ambil kuota default dari MasterJenisCuti yang memotong cuti tahunan
            $masterCutiTahunan = MasterJenisCuti::where('potong_cuti_tahunan', true)->first();
            $kuotaDefault = $masterCutiTahunan ? (int) $masterCutiTahunan->kuota_default : 12;

            // Buat otomatis jika belum ada untuk tahun berjalan
            $saldoCuti = SaldoCuti::firstOrCreate(
                [
                    'karyawan_id'   => $karyawan->id,
                    'tahun_periode' => $tahunIni,
                ],
                [
                    'hak_cuti_tahunan' => $kuotaDefault,
                    'cuti_terpakai'    => 0,
                ]
            );

            // Sinkronisasi otomatis jika kuota_default di MasterJenisCuti diubah HR di tengah tahun
            if ((int) $saldoCuti->hak_cuti_tahunan !== $kuotaDefault) {
                $saldoCuti->update([
                    'hak_cuti_tahunan' => $kuotaDefault,
                ]);
            }

            $hakCutiTahunan = (int) $saldoCuti->hak_cuti_tahunan;
            $cutiTerpakai   = (int) $saldoCuti->cuti_terpakai;
            $sisaCuti       = max(0, $hakCutiTahunan - $cutiTerpakai);

            $pinjamanAktif = PinjamanKaryawan::where('karyawan_id', $karyawan->id)
                ->where('status', '!=', 'Lunas')
                ->sum('sisa_pinjaman');

            $sisaKasbon = max(0, $sisaKasbon - $pinjamanAktif);
        }
        // --- SELESAI HITUNG DATA DINAMIS ---

        switch ($roleId) {
            case 1: // Super Admin
            case 2: // Direktur
            case 3: // HC
            case 4: // Finance
                return Inertia::render('Dashboard', $this->dataEksekutif($user, $karyawan));

            case 5: // Supervisor / Manager
                $pendingCuti = [];
                $pendingLembur = [];
                $pendingSpj = [];

                // Variabel Absensi Pribadi & Pengumuman
                $deptId = $karyawan ? $karyawan->departemen_id : null;
                $pengumumanAktif = \App\Http\Controllers\PengumumanController::getPengumumanAktif($deptId);

                $absensiHariIni = null;
                $statistikBulanIni = ['hadir' => 0, 'terlambat' => 0, 'izin' => 0, 'alpha' => 0];
                $absensiMingguIni = [];

                if ($karyawan) {
                    // --- 1. MANAJERIAL (Bawahan & Delegasi) ---
                    $karyawanId = $karyawan->id;
                    $hariIni = Carbon::now()->toDateString();
                    $waktuHariIni = Carbon::now('Asia/Jakarta')->startOfDay();

                    $bawahanIds = Karyawan::where('atasan_id', $karyawanId)->pluck('id')->toArray();
                    $pemberiDelegasiIds = \App\Models\DelegasiWewenang::where('penerima_id', $karyawanId)
                        ->where('status', 'Aktif')
                        ->whereDate('tgl_mulai', '<=', $hariIni)
                        ->whereDate('tgl_selesai', '>=', $hariIni)
                        ->pluck('pemberi_id')
                        ->toArray();

                    if (!empty($pemberiDelegasiIds)) {
                        $bawahanTitipanIds = Karyawan::whereIn('atasan_id', $pemberiDelegasiIds)->pluck('id')->toArray();
                        $bawahanIds = array_unique(array_merge($bawahanIds, $bawahanTitipanIds));
                    }

                    $pendingCuti = PengajuanCuti::with('karyawan')->whereIn('karyawan_id', $bawahanIds)->where('status_approval', 'Pending')->get();
                    $pendingLembur = PengajuanLembur::with('karyawan')->whereIn('karyawan_id', $bawahanIds)->where('status_approval', 'Pending')->get();
                    $pendingSpj = PengajuanSpj::with('karyawan')->whereIn('karyawan_id', $bawahanIds)->where('status_approval', 'Pending')->get();

                    // --- 2. ABSENSI PRIBADI SPV ---
                    $absensiHariIni = Absensi::where('karyawan_id', $karyawan->id)
                        ->whereDate('tanggal', $waktuHariIni->toDateString())
                        ->first();

                    $awalBulan = $waktuHariIni->copy()->startOfMonth();
                    $akhirBulan = $waktuHariIni->copy()->endOfMonth();
                    $absensiBulanIni = Absensi::where('karyawan_id', $karyawan->id)
                        ->whereBetween('tanggal', [$awalBulan->toDateString(), $akhirBulan->toDateString()])
                        ->get(['tanggal', 'status', 'waktu_masuk', 'waktu_keluar']);

                    $statistikBulanIni = [
                        'hadir'     => $absensiBulanIni->whereIn('status', ['Hadir', 'Dinas Luar'])->count(),
                        'terlambat' => $absensiBulanIni->where('status', 'Terlambat')->count(),
                        'izin'      => $absensiBulanIni->where('status', 'Izin')->count(),
                        'alpha'     => $absensiBulanIni->where('status', 'Alpha')->count(),
                    ];

                    $awal7Hari = $waktuHariIni->copy()->subDays(6);
                    $absensiMingguIni = Absensi::where('karyawan_id', $karyawan->id)
                        ->whereBetween('tanggal', [$awal7Hari->toDateString(), $waktuHariIni->toDateString()])
                        ->orderBy('tanggal')
                        ->get(['tanggal', 'status', 'waktu_masuk', 'waktu_keluar']);
                }

                return Inertia::render('Dashboard/Supervisor', [
                    'pendingCuti'       => $pendingCuti,
                    'pendingLembur'     => $pendingLembur,
                    'pendingSpj'        => $pendingSpj,
                    'sisaCuti'          => $sisaCuti,
                    'hakCutiTahunan'    => $hakCutiTahunan,
                    'cutiTerpakai'      => $cutiTerpakai,
                    'sisaKasbon'        => $sisaKasbon,
                    'pengumuman'        => $pengumumanAktif,
                    'absensiHariIni'    => $absensiHariIni,
                    'statistikBulanIni' => $statistikBulanIni,
                    'absensiMingguIni'  => $absensiMingguIni,
                ]);

            case 6: // Karyawan
            default:
                $deptId = $karyawan ? $karyawan->departemen_id : null;
                $pengumumanAktif = \App\Http\Controllers\PengumumanController::getPengumumanAktif($deptId);

                $absensiHariIni = null;
                $statistikBulanIni = [
                    'hadir'     => 0,
                    'terlambat' => 0,
                    'izin'      => 0,
                    'alpha'     => 0,
                ];
                $absensiMingguIni = [];

                if ($karyawan) {
                    $hariIni = Carbon::now('Asia/Jakarta')->startOfDay();

                    // ABSENSI HARI INI
                    $absensiHariIni = Absensi::where('karyawan_id', $karyawan->id)
                        ->whereDate('tanggal', $hariIni->toDateString())
                        ->first();

                    // ABSENSI BULAN INI
                    $awalBulan = $hariIni->copy()->startOfMonth();
                    $akhirBulan = $hariIni->copy()->endOfMonth();

                    $absensiBulanIni = Absensi::where('karyawan_id', $karyawan->id)
                        ->whereBetween('tanggal', [
                            $awalBulan->toDateString(),
                            $akhirBulan->toDateString()
                        ])
                        ->get([
                            'tanggal',
                            'status',
                            'waktu_masuk',
                            'waktu_keluar'
                        ]);

                    // STATISTIK BULAN INI
                    $statistikBulanIni = [
                        'hadir'     => $absensiBulanIni->whereIn('status', ['Hadir', 'Dinas Luar'])->count(),
                        'terlambat' => $absensiBulanIni->where('status', 'Terlambat')->count(),
                        'izin'      => $absensiBulanIni->where('status', 'Izin')->count(),
                        'alpha'     => $absensiBulanIni->where('status', 'Alpha')->count(),
                    ];

                    // ABSENSI 7 HARI TERAKHIR
                    $awal7Hari = $hariIni->copy()->subDays(6);

                    $absensiMingguIni = Absensi::where('karyawan_id', $karyawan->id)
                        ->whereBetween('tanggal', [
                            $awal7Hari->toDateString(),
                            $hariIni->toDateString()
                        ])
                        ->orderBy('tanggal')
                        ->get([
                            'tanggal',
                            'status',
                            'waktu_masuk',
                            'waktu_keluar'
                        ]);
                }

                return Inertia::render('Dashboard/Karyawan', [
                    'sisaCuti'          => $sisaCuti,
                    'hakCutiTahunan'    => $hakCutiTahunan,
                    'cutiTerpakai'      => $cutiTerpakai,
                    'sisaKasbon'        => $sisaKasbon,
                    'pengumuman'        => $pengumumanAktif,
                    'absensiHariIni'    => $absensiHariIni,
                    'statistikBulanIni' => $statistikBulanIni,
                    'absensiMingguIni'  => $absensiMingguIni,
                ]);
        }
    }

    /**
     * Data agregat dashboard eksekutif (Super Admin, Direktur, HC, Finance).
     */
    private function dataEksekutif($user, $karyawan): array
    {
        $sekarang = Carbon::now('Asia/Jakarta');
        $hariIni = $sekarang->toDateString();
        $bulanIni = (int) $sekarang->month;
        $tahunIni = (int) $sekarang->year;

        $boleh = fn (string $nama) => DynamicRolePermission::bolehAkses($user, $nama);
        $tautan = fn (string $nama) => $boleh($nama) ? route($nama) : null;

        // --- A. KPI KARYAWAN & DEPARTEMEN ---
        $totalKaryawan = Karyawan::where('status_aktif', true)->count();
        $departemens = Departemen::whereNull('deleted_at')->orderBy('kode_departemen')->get(['id', 'kode_departemen', 'nama_departemen']);

        // --- B. KEHADIRAN HARI INI ---
        $absensiHariIni = Absensi::whereDate('tanggal', $hariIni)
            ->whereHas('karyawan', fn ($q) => $q->where('status_aktif', true))
            ->select('status', DB::raw('count(*) as jml'))
            ->groupBy('status')
            ->pluck('jml', 'status');

        $hadir = (int) ($absensiHariIni['Hadir'] ?? 0);
        $terlambat = (int) ($absensiHariIni['Terlambat'] ?? 0);
        $dinasLuar = (int) ($absensiHariIni['Dinas Luar'] ?? 0);
        $totalMasuk = $hadir + $terlambat + $dinasLuar;

        // --- C. CUTI & IZIN AKTIF HARI INI ---
        $cutiAktif = PengajuanCuti::where('status_approval', 'Disetujui')
            ->whereDate('tanggal_mulai', '<=', $hariIni)
            ->whereDate('tanggal_selesai', '>=', $hariIni)
            ->count();
        $izinHariIni = (int) ($absensiHariIni['Izin'] ?? 0);

        // --- D. KASBON BERJALAN ---
        $kasbon = PinjamanKaryawan::where('status', 'Berjalan')
            ->selectRaw('count(*) as jml, coalesce(sum(sisa_pinjaman), 0) as sisa')
            ->first();

        // --- E. PAYROLL: periode berjalan, jika belum di-generate pakai periode terakhir ---
        $periode = ['bulan' => $bulanIni, 'tahun' => $tahunIni];
        $adaBulanIni = Payroll::where('periode_bulan', $bulanIni)->where('periode_tahun', $tahunIni)->exists();
        if (!$adaBulanIni) {
            $terakhir = Payroll::orderByDesc('periode_tahun')->orderByDesc('periode_bulan')->first(['periode_bulan', 'periode_tahun']);
            if ($terakhir) {
                $periode = ['bulan' => (int) $terakhir->periode_bulan, 'tahun' => (int) $terakhir->periode_tahun];
            }
        }

        $payrollPeriode = Payroll::where('periode_bulan', $periode['bulan'])->where('periode_tahun', $periode['tahun']);
        $statusPayroll = (clone $payrollPeriode)->select('status', DB::raw('count(*) as jml'))->groupBy('status')->pluck('jml', 'status');
        $totalGajiBersih = (float) (clone $payrollPeriode)->sum('total_gaji_bersih');

        // Komposisi pengeluaran payroll dari detail_payrolls (nama komponen mengikuti PayrollCalculator)
        $kategori = "CASE
            WHEN nama_komponen_snapshot LIKE 'Cicilan Kasbon%' THEN 'kasbon'
            WHEN nama_komponen_snapshot LIKE 'Iuran BPJS%' OR nama_komponen_snapshot LIKE 'PPh 21%' THEN 'bpjs_pph'
            WHEN nama_komponen_snapshot LIKE 'Uang Lembur%' OR nama_komponen_snapshot LIKE 'Pencairan SPJ%' THEN 'lembur_spj'
            WHEN jenis = 'Pemasukan' THEN 'gaji_tunjangan'
            ELSE 'lainnya' END";
        $komposisiRaw = DetailPayroll::whereIn('payroll_id', (clone $payrollPeriode)->select('id'))
            ->selectRaw("$kategori as kategori, coalesce(sum(nominal), 0) as total")
            ->groupBy(DB::raw($kategori))
            ->pluck('total', 'kategori');

        $komposisiPayroll = collect([
            ['kunci' => 'gaji_tunjangan', 'label' => 'Gaji Pokok & Tunjangan'],
            ['kunci' => 'lembur_spj',     'label' => 'Lembur & SPJ'],
            ['kunci' => 'bpjs_pph',       'label' => 'Potongan BPJS & PPh 21'],
            ['kunci' => 'kasbon',         'label' => 'Cicilan Kasbon'],
        ])->map(fn ($k) => $k + ['nilai' => (float) ($komposisiRaw[$k['kunci']] ?? 0)])->values();

        // --- F. SEBARAN KARYAWAN & KEHADIRAN PER DEPARTEMEN ---
        $karyawanPerDept = Karyawan::where('status_aktif', true)
            ->select('departemen_id', DB::raw('count(*) as jml'))
            ->groupBy('departemen_id')
            ->pluck('jml', 'departemen_id');
        $hadirPerDept = Absensi::join('karyawans', 'karyawans.id', '=', 'absensis.karyawan_id')
            ->whereDate('absensis.tanggal', $hariIni)
            ->where('karyawans.status_aktif', true)
            ->whereNull('karyawans.deleted_at')
            ->whereIn('absensis.status', ['Hadir', 'Terlambat', 'Dinas Luar'])
            ->select('karyawans.departemen_id', DB::raw('count(*) as jml'))
            ->groupBy('karyawans.departemen_id')
            ->pluck('jml', 'karyawans.departemen_id');

        $sebaranDepartemen = $departemens->map(fn ($d) => [
            'kode'     => $d->kode_departemen,
            'nama'     => $d->nama_departemen,
            'karyawan' => (int) ($karyawanPerDept[$d->id] ?? 0),
            'hadir'    => (int) ($hadirPerDept[$d->id] ?? 0),
        ])->sortByDesc('karyawan')->values();

        // --- G. MENUNGGU PERSETUJUAN (Cuti, Lembur, Kasbon) ---
        $statusMenunggu = ['Pending', 'Disetujui Atasan'];
        $denganKaryawan = ['karyawan:id,nama_lengkap,departemen_id', 'karyawan.departemen:id,kode_departemen,nama_departemen'];
        $urlCuti = $tautan('admin.cuti.index');
        $urlLembur = $tautan('admin.lembur.index');
        $urlKasbon = $tautan('admin.pinjaman.index');

        $baris = fn ($item, string $jenis, string $detail, string $status, ?string $url) => [
            'id'         => $jenis . '-' . $item->id,
            'nama'       => $item->karyawan->nama_lengkap ?? '-',
            'departemen' => $item->karyawan->departemen->kode_departemen ?? '-',
            'jenis'      => $jenis,
            'detail'     => $detail,
            'status'     => $status,
            'diajukan'   => optional($item->created_at)->toIso8601String(),
            'url'        => $url,
        ];

        $qCuti = PengajuanCuti::whereIn('status_approval', $statusMenunggu);
        $qLembur = PengajuanLembur::whereIn('status_approval', $statusMenunggu);
        $qKasbon = PinjamanKaryawan::whereIn('status', $statusMenunggu);

        $tglId = fn ($t) => $t ? Carbon::parse($t)->locale('id')->translatedFormat('d M Y') : '-';

        $pending = collect()
            ->concat((clone $qCuti)->with($denganKaryawan)->latest()->limit(8)->get()
                ->map(fn ($c) => $baris($c, 'Cuti', $tglId($c->tanggal_mulai) . ' – ' . $tglId($c->tanggal_selesai), $c->status_approval, $urlCuti)))
            ->concat((clone $qLembur)->with($denganKaryawan)->latest()->limit(8)->get()
                ->map(fn ($l) => $baris($l, 'Lembur', $tglId($l->tanggal) . ', ' . substr((string) $l->jam_mulai, 0, 5) . '–' . substr((string) $l->jam_selesai, 0, 5), $l->status_approval, $urlLembur)))
            ->concat((clone $qKasbon)->with($denganKaryawan)->latest()->limit(8)->get()
                ->map(fn ($p) => $baris($p, 'Kasbon', 'Rp ' . number_format((float) $p->total_pinjaman, 0, ',', '.'), $p->status, $urlKasbon)))
            ->sortByDesc('diajukan')
            ->take(8)
            ->values();

        $jumlahPending = [
            'cuti'   => (clone $qCuti)->count(),
            'lembur' => (clone $qLembur)->count(),
            'kasbon' => (clone $qKasbon)->count(),
        ];

        // --- H. PENGUMUMAN & AKSES CEPAT ---
        $pengumuman = PengumumanController::getPengumumanAktif($karyawan?->departemen_id)->take(4)->values();

        $kandidatPintasan = [
            1 => ['karyawan.index', 'admin.role.index', 'admin.payroll.index', 'pengumuman.index', 'admin.audit.index', 'absensi.index'],
            2 => ['karyawan.index', 'admin.payroll.index', 'admin.pinjaman.index', 'admin.spj.index', 'absensi.index', 'pengumuman.index'],
            3 => ['karyawan.index', 'absensi.index', 'admin.cuti.index', 'jadwal-shift.index', 'pengumuman.index', 'admin.lembur.index'],
            4 => ['admin.payroll.index', 'admin.pinjaman.index', 'admin.spj.index', 'admin.komponen.index', 'absensi.index', 'pengumuman.index'],
        ];
        $labelPintasan = [
            'karyawan.index'           => 'Data Karyawan',
            'admin.role.index'         => 'Role & Menu',
            'admin.payroll.index'      => 'Payroll',
            'pengumuman.index'         => 'Pengumuman',
            'admin.audit.index'        => 'Audit Trail',
            'absensi.index'            => 'Rekap Absensi',
            'admin.pinjaman.index'     => 'Kasbon',
            'admin.spj.index'          => 'SPJ Dinas',
            'admin.cuti.index'         => 'Approval Cuti',
            'admin.lembur.index'       => 'Approval Lembur',
            'jadwal-shift.index'       => 'Jadwal Shift',
            'admin.komponen.index'     => 'Komponen Gaji',
        ];
        $pintasan = collect($kandidatPintasan[$user->role_id] ?? [])
            ->filter(fn ($r) => Route::has($r) && $boleh($r))
            ->take(4)
            ->map(fn ($r) => ['kunci' => $r, 'label' => $labelPintasan[$r], 'url' => route($r)])
            ->values();

        // Tombol aksi cepat di banner sesuai role
        $aksiUtama = match ($user->role_id) {
            4       => ['label' => 'Generate Payroll', 'route' => 'admin.payroll.index'],
            3       => ['label' => 'Jadwal Shift OPM', 'route' => 'jadwal-shift.index'],
            default => ['label' => 'Kelola Karyawan', 'route' => 'karyawan.index'],
        };
        $aksiUtama = $boleh($aksiUtama['route'])
            ? ['label' => $aksiUtama['label'], 'url' => route($aksiUtama['route'])]
            : null;

        return [
            'kpi' => [
                'karyawan' => [
                    'total'      => $totalKaryawan,
                    'departemen' => $departemens->count(),
                ],
                'kehadiran' => [
                    'hadir'      => $hadir,
                    'terlambat'  => $terlambat,
                    'dinasLuar'  => $dinasLuar,
                    'total'      => $totalMasuk,
                    'persen'     => $totalKaryawan > 0 ? round($totalMasuk / $totalKaryawan * 100, 1) : 0,
                ],
                'cuti' => [
                    'cuti' => $cutiAktif,
                    'izin' => $izinHariIni,
                ],
                'kasbon' => [
                    'jumlah' => (int) ($kasbon->jml ?? 0),
                    'sisa'   => (float) ($kasbon->sisa ?? 0),
                ],
                'payroll' => [
                    'total'        => $totalGajiBersih,
                    'bulan'        => $periode['bulan'],
                    'tahun'        => $periode['tahun'],
                    'bulanBerjalan'=> $periode['bulan'] === $bulanIni && $periode['tahun'] === $tahunIni,
                    'status'       => $statusPayroll->map(fn ($n) => (int) $n),
                ],
            ],
            'sebaranDepartemen' => $sebaranDepartemen,
            'komposisiPayroll'  => $komposisiPayroll,
            'pending'           => $pending,
            'jumlahPending'     => $jumlahPending,
            'pengumuman'        => $pengumuman,
            'pintasan'          => $pintasan,
            'aksiUtama'         => $aksiUtama,
            'tanggalHariIni'    => $hariIni,
        ];
    }
}
