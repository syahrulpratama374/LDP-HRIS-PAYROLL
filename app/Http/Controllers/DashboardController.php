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
            case 1: // Super Admin 
                return Inertia::render('Dashboard/Admin');
            case 2: // Direktur (Sesuai ID 2 di database)
                return Inertia::render('Dashboard/Direktur');
            case 3: // HRD / HC
                return Inertia::render('Dashboard/HC');
            case 4: // Finance
                return Inertia::render('Dashboard/Finance');
            case 5: // Supervisor (Sesuai ID 5 di database)
                return Inertia::render('Dashboard/Supervisor');
            case 6: // Karyawan 
                return Inertia::render('Dashboard/Karyawan');
            default:
                return Inertia::render('Dashboard/Karyawan');
        }
    }
}