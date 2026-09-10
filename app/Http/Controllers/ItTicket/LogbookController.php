<?php

namespace App\Http\Controllers\ItTicket;

use App\Http\Controllers\Controller;
use App\Models\LogbookShift;
use App\Models\MasterShift;
use App\Models\Karyawan;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class LogbookController extends Controller
{
    public function index()
    {
        // Menampilkan logbook dari yang terbaru
        $logbooks = LogbookShift::with(['karyawan.departemen', 'shift'])
            ->orderBy('tanggal', 'desc')
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        $shifts = MasterShift::orderBy('jam_masuk')->get();

        return Inertia::render('ItTicket/Logbook/Index', [
            'logbooks' => $logbooks,
            'shifts' => $shifts
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'shift_id' => 'required|exists:master_shifts,id',
            'catatan_handover' => 'required|string|min:10',
        ]);

        // Cari Karyawan ID berdasarkan User yang sedang login
        $karyawan = Karyawan::where('user_id', Auth::id())->firstOrFail();

        LogbookShift::create([
            'karyawan_id' => $karyawan->id,
            'shift_id' => $request->shift_id,
            'tanggal' => date('Y-m-d'),
            'catatan_handover' => $request->catatan_handover,
        ]);

        return redirect()->back()->with('success', 'Handover Logbook berhasil dicatat!');
    }
}