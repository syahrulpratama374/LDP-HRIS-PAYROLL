<?php

namespace App\Http\Controllers;

use App\Models\Golongan;
use Illuminate\Http\Request;
use Inertia\Inertia;

class GolonganController extends Controller
{
    public function index()
    {
        $golongans = Golongan::latest()->get();
        return Inertia::render('MasterData/Golongan/Index', [
            'golongans' => $golongans
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'kode_golongan' => 'required|string|max:20|unique:golongans',
            'nama_golongan' => 'required|string|max:100',
            'gaji_pokok' => 'required|numeric|min:0',
        ]);

        Golongan::create($validated);
        return redirect()->back()->with('success', 'Data Golongan berhasil ditambahkan.');
    }

    public function update(Request $request, $id)
    {
        $golongan = Golongan::findOrFail($id);
        
        $validated = $request->validate([
            'kode_golongan' => 'required|string|max:20|unique:golongans,kode_golongan,' . $golongan->id,
            'nama_golongan' => 'required|string|max:100',
            'gaji_pokok' => 'required|numeric|min:0',
        ]);

        $golongan->update($validated);
        return redirect()->back()->with('success', 'Data Golongan berhasil diperbarui.');
    }

    public function destroy($id)
    {
        Golongan::findOrFail($id)->delete();
        return redirect()->back()->with('success', 'Data Golongan berhasil dihapus.');
    }
}