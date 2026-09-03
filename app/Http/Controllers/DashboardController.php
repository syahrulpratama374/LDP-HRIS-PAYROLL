<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        
        // Membaca role_id user. Jika tidak ada, default ke 6 (Karyawan)
        $roleId = $user->role_id ?? 6; 

        switch ($roleId) {
            case 1: // Sesuai DB: Syahrul
                return Inertia::render('Dashboard/Admin');
            case 2:
                return Inertia::render('Dashboard/Supervisor');
            case 3:
                return Inertia::render('Dashboard/HC');
            case 4:
                return Inertia::render('Dashboard/Finance');
            case 5:
                return Inertia::render('Dashboard/Direktur');
            case 6: // Sesuai DB: Kevin
                return Inertia::render('Dashboard/Karyawan');
            default:
                return Inertia::render('Dashboard/Karyawan');
        }
    }
}