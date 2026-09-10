<?php

namespace App\Http\Controllers\MasterData;

use App\Http\Controllers\Controller;
use App\Models\MasterShift;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MasterShiftController extends Controller
{
    public function index()
    {
        $shifts = MasterShift::orderBy('jam_masuk')->get();
        return Inertia::render('MasterData/Shift/Index', ['shifts' => $shifts]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'kode_shift' => 'required|string|max:20|unique:master_shifts,kode_shift',
            'nama_shift' => 'required|string|max:50',
            'jam_masuk' => 'required|date_format:H:i',
            'jam_keluar' => 'required|date_format:H:i',
            'lintas_hari' => 'boolean',
        ]);

        MasterShift::create($request->all());
        return redirect()->back()->with('success', 'Master Shift berhasil ditambahkan.');
    }

    public function update(Request $request, $id)
    {
        $shift = MasterShift::findOrFail($id);
        
        $request->validate([
            'kode_shift' => 'required|string|max:20|unique:master_shifts,kode_shift,' . $id,
            'nama_shift' => 'required|string|max:50',
            'jam_masuk' => 'required|date_format:H:i',
            'jam_keluar' => 'required|date_format:H:i',
            'lintas_hari' => 'boolean',
        ]);

        $shift->update($request->all());
        return redirect()->back()->with('success', 'Master Shift berhasil diperbarui.');
    }

    public function destroy($id)
    {
        MasterShift::findOrFail($id)->delete();
        return redirect()->back()->with('success', 'Master Shift berhasil dihapus.');
    }
}