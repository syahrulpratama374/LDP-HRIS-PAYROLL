<?php

namespace App\Http\Controllers\Payroll;

use App\Http\Controllers\Controller;
use App\Models\MasterKomponenPayroll;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MasterKomponenPayrollController extends Controller
{
    public function index()
    {
        $komponens = MasterKomponenPayroll::orderBy('jenis', 'asc')->orderBy('nama_komponen', 'asc')->get();
        return Inertia::render('Payroll/KomponenGaji/Index', [
            'komponens' => $komponens
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'kode_komponen' => 'required|string|max:50|unique:master_komponen_payrolls,kode_komponen',
            'nama_komponen' => 'required|string|max:100',
            'jenis' => 'required|in:Tunjangan,Potongan',
            'is_taxable' => 'boolean',
        ]);

        MasterKomponenPayroll::create($request->all());
        return redirect()->back()->with('success', 'Komponen Payroll berhasil ditambahkan.');
    }

    public function update(Request $request, $id)
    {
        $komponen = MasterKomponenPayroll::findOrFail($id);
        
        $request->validate([
            'kode_komponen' => 'required|string|max:50|unique:master_komponen_payrolls,kode_komponen,' . $id,
            'nama_komponen' => 'required|string|max:100',
            'jenis' => 'required|in:Tunjangan,Potongan',
            'is_taxable' => 'boolean',
        ]);

        $komponen->update($request->all());
        return redirect()->back()->with('success', 'Komponen Payroll berhasil diperbarui.');
    }

    public function destroy($id)
    {
        MasterKomponenPayroll::findOrFail($id)->delete();
        return redirect()->back()->with('success', 'Komponen Payroll berhasil dihapus.');
    }
}