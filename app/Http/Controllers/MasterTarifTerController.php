<?php

namespace App\Http\Controllers;

use App\Models\MasterTarifTer;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MasterTarifTerController extends Controller
{
    public function index()
    {
        return Inertia::render('MasterData/TarifTer/Index', [
            'tarifs' => MasterTarifTer::orderBy('kategori')->orderBy('batas_bawah')->get(),
        ]);
    }

    private function rules(): array
    {
        return [
            'kategori' => 'required|in:A,B,C',
            'batas_bawah' => 'required|numeric|min:0',
            'batas_atas' => 'nullable|numeric|gt:batas_bawah',
            'tarif' => 'required|numeric|min:0|max:100',
        ];
    }

    public function store(Request $request)
    {
        MasterTarifTer::create($request->validate($this->rules()));
        return redirect()->back()->with('success', 'Tarif TER berhasil ditambahkan.');
    }

    public function update(Request $request, $id)
    {
        MasterTarifTer::findOrFail($id)->update($request->validate($this->rules()));
        return redirect()->back()->with('success', 'Tarif TER berhasil diperbarui.');
    }

    public function destroy($id)
    {
        MasterTarifTer::findOrFail($id)->delete();
        return redirect()->back()->with('success', 'Tarif TER berhasil dihapus.');
    }
}
