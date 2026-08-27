<?php

namespace App\Http\Controllers;

use App\Models\Jabatan;
use Illuminate\Http\Request;
use Inertia\Inertia;

class JabatanController extends Controller
{
    public function index()
    {
        $jabatans = Jabatan::latest()->get();
        return Inertia::render('MasterData/Jabatan/Index', [
            'jabatans' => $jabatans
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'kode_jabatan' => 'required|string|max:20|unique:jabatans',
            'nama_jabatan' => 'required|string|max:100',
        ]);

        Jabatan::create($validated);
        return redirect()->back()->with('success', 'Data Jabatan berhasil ditambahkan.');
    }

    public function update(Request $request, $id)
    {
        $jabatan = Jabatan::findOrFail($id);
        
        $validated = $request->validate([
            'kode_jabatan' => 'required|string|max:20|unique:jabatans,kode_jabatan,' . $jabatan->id,
            'nama_jabatan' => 'required|string|max:100',
        ]);

        $jabatan->update($validated);
        return redirect()->back()->with('success', 'Data Jabatan berhasil diperbarui.');
    }

    public function destroy($id)
    {
        Jabatan::findOrFail($id)->delete();
        return redirect()->back()->with('success', 'Data Jabatan berhasil dihapus.');
    }
}