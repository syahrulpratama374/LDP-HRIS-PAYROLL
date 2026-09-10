<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Karyawan;
use App\Models\PengajuanCuti;
use App\Models\PengajuanLembur;
use App\Models\PengajuanSpj;
use App\Models\SaldoCuti;
use App\Models\PinjamanKaryawan;
use App\Models\Payroll;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $roleId = $user->role_id ?? 6; 
        
        // --- 1. HITUNG DATA DINAMIS SELF-SERVICE (Untuk Karyawan & SPV) ---
        $sisaCuti = 0;
        $sisaKasbon = 5000000; 

        $karyawan = $user->karyawan;
        if ($karyawan) {
            $tahunIni = date('Y');
            $saldoCuti = SaldoCuti::where('karyawan_id', $karyawan->id)
                ->where('tahun_periode', $tahunIni)
                ->first();
            
            if ($saldoCuti) {
                $sisaCuti = $saldoCuti->hak_cuti_tahunan - $saldoCuti->cuti_terpakai;
            }

            $pinjamanAktif = PinjamanKaryawan::where('karyawan_id', $karyawan->id)
                ->where('status', '!=', 'Lunas')
                ->sum('sisa_pinjaman');
            
            $sisaKasbon = max(0, $sisaKasbon - $pinjamanAktif);
        }
        // --- SELESAI HITUNG DATA DINAMIS ---

        switch ($roleId) {
            case 1: 
                return Inertia::render('Dashboard/Admin');
            
            case 2: // --- DASHBOARD DIREKTUR / EKSEKUTIF ---
                $bulanIni = date('m');
                $tahunIni = date('Y');

                // A. Analitik Makro
                $totalKaryawan = Karyawan::where('status_aktif', true)->count();
                
                $bebanGaji = Payroll::where('periode_bulan', $bulanIni)
                    ->where('periode_tahun', $tahunIni)
                    ->sum('total_gaji_bersih');

                $realisasiSpj = PengajuanSpj::whereMonth('tgl_selesai', $bulanIni)
                    ->whereYear('tgl_selesai', $tahunIni)
                    ->whereIn('status_approval', ['Selesai', 'Menunggu Validasi Finance'])
                    ->sum('total_biaya');

                // B. Dokumen Menunggu Final Approval (Veto Threshold Direktur)
                $pendingSpjDirektur = PengajuanSpj::with('karyawan')
                    ->where('status_approval', 'Menunggu Approval Direktur')
                    ->get();
                
                $pendingKasbonDirektur = PinjamanKaryawan::with('karyawan')
                    ->where('status', 'Menunggu Approval Direktur')
                    ->get();

                return Inertia::render('Dashboard/Direktur', [
                    'statistik' => [
                        'totalKaryawan' => $totalKaryawan,
                        'bebanGaji' => (double) $bebanGaji,
                        'realisasiSpj' => (double) $realisasiSpj,
                    ],
                    'pendingSpj' => $pendingSpjDirektur,
                    'pendingKasbon' => $pendingKasbonDirektur,
                ]);

            case 3: 
                return Inertia::render('Dashboard/HC');
            
            case 4: 
                return Inertia::render('Dashboard/Finance');
            
            case 5: // Supervisor / Manager
                $pendingCuti = [];
                $pendingLembur = [];
                $pendingSpj = [];

                if ($karyawan) {
                    $karyawanId = $karyawan->id;
                    $hariIni = Carbon::now()->toDateString();

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
                }

                return Inertia::render('Dashboard/Supervisor', [
                    'pendingCuti' => $pendingCuti,
                    'pendingLembur' => $pendingLembur,
                    'pendingSpj' => $pendingSpj,
                    'sisaCuti' => $sisaCuti,
                    'sisaKasbon' => $sisaKasbon,
                ]);

            case 6: // Karyawan 
                // Ambil ID Departemen Karyawan untuk filter pengumuman spesifik
                $deptId = $karyawan ? $karyawan->departemen_id : null;
                
                // Tarik pengumuman aktif dari mesin Broadcast
                $pengumumanAktif = \App\Http\Controllers\PengumumanController::getPengumumanAktif($deptId);

                return Inertia::render('Dashboard/Karyawan', [
                    'sisaCuti' => $sisaCuti,
                    'sisaKasbon' => $sisaKasbon,
                    'pengumuman' => $pengumumanAktif // Lemparkan ke Frontend React
                ]);
                
            default:
                return Inertia::render('Dashboard/Karyawan');
        }
    }
}