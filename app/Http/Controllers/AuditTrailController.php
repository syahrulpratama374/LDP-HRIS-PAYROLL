<?php

namespace App\Http\Controllers;

use App\Models\AuditTrail;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AuditTrailController extends Controller
{
    // [ADMIN / SYSTEM] Menampilkan Log Forensik Pergerakan Sistem
    public function index(Request $request)
    {
        $query = AuditTrail::with('user')
            ->orderBy('waktu', 'desc');

        // Fitur Pencarian (Opsional)
        if ($request->has('search')) {
            $search = $request->search;
            $query->where('modul', 'like', "%{$search}%")
                  ->orWhere('aksi', 'like', "%{$search}%")
                  ->orWhereHas('user', function($q) use ($search) {
                      $q->where('name', 'like', "%{$search}%");
                  });
        }

        $logs = $query->paginate(20)->withQueryString();

        return Inertia::render('AuditTrail/Index', [
            'logs' => $logs,
            'filters' => $request->only('search')
        ]);
    }
}