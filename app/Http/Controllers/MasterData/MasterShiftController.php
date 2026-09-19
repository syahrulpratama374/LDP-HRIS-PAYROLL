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
            'jam_masuk' => 'required|string', // Validasi dilonggarkan
            'jam_keluar' => 'required|string', // Validasi dilonggarkan
            'lintas_hari' => 'boolean',
        ]);

        // Memastikan format jam selalu konsisten sebelum disimpan (H:i)
        $data = $request->all();
        $data['jam_masuk'] = substr($request->jam_masuk, 0, 5);
        $data['jam_keluar'] = substr($request->jam_keluar, 0, 5);

        MasterShift::create($data);
        return redirect()->back()->with('success', 'Master Shift berhasil ditambahkan.');
    }

    public function update(Request $request, $id)
    {
        $shift = MasterShift::findOrFail($id);
        
        $request->validate([
            'kode_shift' => 'required|string|max:20|unique:master_shifts,kode_shift,' . $id,
            'nama_shift' => 'required|string|max:50',
            'jam_masuk' => 'required|string', // Validasi dilonggarkan
            'jam_keluar' => 'required|string', // Validasi dilonggarkan
            'lintas_hari' => 'boolean',
        ]);

        // Memastikan format jam selalu konsisten sebelum disimpan (H:i)
        $data = $request->all();
        $data['jam_masuk'] = substr($request->jam_masuk, 0, 5);
        $data['jam_keluar'] = substr($request->jam_keluar, 0, 5);

        $shift->update($data);
        return redirect()->back()->with('success', 'Master Shift berhasil diperbarui.');
    }

    public function destroy($id)
    {
        MasterShift::findOrFail($id)->delete();
        return redirect()->back()->with('success', 'Master Shift berhasil dihapus.');
    }
}