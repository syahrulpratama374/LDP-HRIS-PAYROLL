<?php

namespace App\Http\Controllers;

use App\Models\Karyawan;
use App\Models\MasterPtkp;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MasterPtkpController extends Controller
{
    public function index()
    {
        return Inertia::render('MasterData/Ptkp/Index', [
            'ptkps' => MasterPtkp::orderBy('kode_ptkp')->get(),
        ]);
    }

    private function rules(?int $id = null): array
    {
        return [
            'kode_ptkp' => 'required|string|max:10|unique:master_ptkps,kode_ptkp' . ($id ? ",$id" : ''),
            'nominal_neto_tahunan' => 'required|numeric|min:0',
            'kategori_ter' => 'required|in:A,B,C',
            'deskripsi' => 'nullable|string|max:255',
        ];
    }

    public function store(Request $request)
    {
        MasterPtkp::create($request->validate($this->rules()));
        return redirect()->back()->with('success', 'Data PTKP berhasil ditambahkan.');
    }

    public function update(Request $request, $id)
    {
        $ptkp = MasterPtkp::findOrFail($id);
        $ptkp->update($request->validate($this->rules($ptkp->id)));
        return redirect()->back()->with('success', 'Data PTKP berhasil diperbarui.');
    }

    public function destroy($id)
    {
        $ptkp = MasterPtkp::findOrFail($id);
        if (Karyawan::where('ptkp_id', $ptkp->id)->exists()) {
            return redirect()->back()->with('error', 'PTKP masih dipakai karyawan, tidak dapat dihapus.');
        }
        $ptkp->delete();
        return redirect()->back()->with('success', 'Data PTKP berhasil dihapus.');
    }
}
