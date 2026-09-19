<?php

namespace App\Http\Controllers\MasterData;

use App\Http\Controllers\Controller;
use App\Models\Departemen;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DepartemenController extends Controller
{
    public function index()
    {
        // Mengambil semua data dari database, diurutkan dari yang terbaru
        $departemens = Departemen::latest()->get();
        
        // Melempar data ke komponen React Inertia
        return Inertia::render('MasterData/Departemen/Index', [
            'departemens' => $departemens
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'kode_departemen' => 'required|string|max:20|unique:departemens',
            'nama_departemen' => 'required|string|max:100',
            'is_wajib_logbook' => 'boolean', // <-- Tambahan baru
        ]);

        Departemen::create($validated);
        return redirect()->back()->with('success', 'Data Departemen berhasil ditambahkan.');
    }

    public function update(Request $request, $id)
    {
        $departemen = Departemen::findOrFail($id);

        $validated = $request->validate([
            'kode_departemen' => 'required|string|max:20|unique:departemens,kode_departemen,' . $departemen->id,
            'nama_departemen' => 'required|string|max:100',
            'is_wajib_logbook' => 'boolean', // <-- Tambahan baru
        ]);

        $departemen->update($validated);
        return redirect()->back()->with('success', 'Data Departemen berhasil diperbarui.');
    }

    public function destroy($id)
    {
        Departemen::findOrFail($id)->delete();

        return redirect()->back()->with('success', 'Data Departemen berhasil dihapus.');
    }
}