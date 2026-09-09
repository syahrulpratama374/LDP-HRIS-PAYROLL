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

class DashboardController extends Controller
{
   public function index(Request $request)
    {
        $user = $request->user();
        $roleId = $user->role_id ?? 6; 
        
        // --- 1. HITUNG DATA DINAMIS SELF-SERVICE (Untuk Supervisor & Karyawan) ---
        $sisaCuti = 0;
        $sisaKasbon = 5000000; // Limit Default (Bisa juga di-query dari tabel pengaturans)

        $karyawan = $user->karyawan;
        if ($karyawan) {
            // Hitung Cuti Dinamis
            $tahunIni = date('Y');
            $saldoCuti = SaldoCuti::where('karyawan_id', $karyawan->id)
                ->where('tahun_periode', $tahunIni)
                ->first();
            
            if ($saldoCuti) {
                $sisaCuti = $saldoCuti->hak_cuti_tahunan - $saldoCuti->cuti_terpakai;
            }

            // Hitung Kasbon Dinamis
            $pinjamanAktif = PinjamanKaryawan::where('karyawan_id', $karyawan->id)
                ->where('status', '!=', 'Lunas')
                ->sum('sisa_pinjaman');
            
            $sisaKasbon = max(0, $sisaKasbon - $pinjamanAktif);
        }
        // --- SELESAI HITUNG DATA DINAMIS ---


        switch ($roleId) {
            case 1: 
                return Inertia::render('Dashboard/Admin');
            case 2: 
                return Inertia::render('Dashboard/Direktur');
            case 3: 
                return Inertia::render('Dashboard/HC');
            case 4: 
                return Inertia::render('Dashboard/Finance');
           case 5: // Supervisor / Manager
                $pendingCuti = [];
                $pendingLembur = [];
                $pendingSpj = [];

                if ($karyawan) {
                    // REVISI: Tarik ID karyawan yang atasan langsungnya adalah user ini
                    $bawahanIds = Karyawan::where('atasan_id', $karyawan->id)->pluck('id');

                    // Sisa query tetap sama, menarik data berdasarkan $bawahanIds
                    $pendingCuti = PengajuanCuti::with('karyawan')->whereIn('karyawan_id', $bawahanIds)->where('status_approval', 'Pending')->get();
                    $pendingLembur = PengajuanLembur::with('karyawan')->whereIn('karyawan_id', $bawahanIds)->where('status_approval', 'Pending')->get();
                    $pendingSpj = PengajuanSpj::with('karyawan')->whereIn('karyawan_id', $bawahanIds)->where('status_approval', 'Pending')->get();
                }

                return Inertia::render('Dashboard/Supervisor', [
                    'pendingCuti' => $pendingCuti,
                    'pendingLembur' => $pendingLembur,
                    'pendingSpj' => $pendingSpj,
                    'sisaCuti' => $sisaCuti,      // <--- Kirim variabel dinamis
                    'sisaKasbon' => $sisaKasbon,  // <--- Kirim variabel dinamis
                ]);

            case 6: // Karyawan 
                return Inertia::render('Dashboard/Karyawan', [
                    'sisaCuti' => $sisaCuti,      // <--- Kirim variabel dinamis
                    'sisaKasbon' => $sisaKasbon,  // <--- Kirim variabel dinamis
                ]);
                
            default:
                return Inertia::render('Dashboard/Karyawan');
        }
    }
}