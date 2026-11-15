<?php

namespace App\Http\Controllers\Payroll;

use App\Http\Controllers\Controller;
use App\Models\Karyawan;
use App\Models\KomponenPayrollKaryawan;
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
            'jenis' => 'required|in:Pemasukan,Potongan',
            'is_taxable' => 'boolean',
        ]);

        MasterKomponenPayroll::create($request->only(['kode_komponen', 'nama_komponen', 'jenis', 'is_taxable']));
        return redirect()->back()->with('success', 'Komponen Payroll berhasil ditambahkan.');
    }

    public function update(Request $request, $id)
    {
        $komponen = MasterKomponenPayroll::findOrFail($id);
        
        $request->validate([
            'kode_komponen' => 'required|string|max:50|unique:master_komponen_payrolls,kode_komponen,' . $id,
            'nama_komponen' => 'required|string|max:100',
            'jenis' => 'required|in:Pemasukan,Potongan',
            'is_taxable' => 'boolean',
        ]);

        $komponen->update($request->only(['kode_komponen', 'nama_komponen', 'jenis', 'is_taxable']));
        return redirect()->back()->with('success', 'Komponen Payroll berhasil diperbarui.');
    }

    public function destroy($id)
    {
        $komponen = MasterKomponenPayroll::findOrFail($id);
        if (KomponenPayrollKaryawan::where('komponen_id', $id)->exists()) {
            return redirect()->back()->withErrors(['error' => 'Komponen masih dipakai oleh karyawan, lepaskan dulu penugasannya.']);
        }
        $komponen->delete();
        return redirect()->back()->with('success', 'Komponen Payroll berhasil dihapus.');
    }

    // Daftar penugasan komponen tetap per karyawan
    public function karyawanIndex()
    {
        return Inertia::render('Payroll/KomponenGaji/Karyawan', [
            'penugasans' => KomponenPayrollKaryawan::with(['karyawan:id,nama_lengkap,nik_internal', 'komponen:id,kode_komponen,nama_komponen,jenis'])
                ->orderBy('karyawan_id')->get(),
            'karyawans' => Karyawan::where('status_aktif', true)->orderBy('nama_lengkap')->get(['id', 'nama_lengkap', 'nik_internal']),
            'komponens' => MasterKomponenPayroll::whereNotIn('kode_komponen', ['GP', 'TJ', 'LBR', 'SPJ', 'KASBON', 'BONUS-KPI', 'POT-ABSEN', 'BPJS-KS', 'BPJS-JHT', 'BPJS-JP', 'PPH21'])
                ->orderBy('nama_komponen')->get(),
        ]);
    }

    public function karyawanStore(Request $request)
    {
        $data = $request->validate([
            'karyawan_id' => 'required|exists:karyawans,id',
            'komponen_id' => 'required|exists:master_komponen_payrolls,id',
            'nominal' => 'required|numeric|min:0|max:999999999999',
        ]);

        KomponenPayrollKaryawan::updateOrCreate(
            ['karyawan_id' => $data['karyawan_id'], 'komponen_id' => $data['komponen_id']],
            ['nominal' => $data['nominal']]
        );

        return redirect()->back()->with('success', 'Komponen karyawan disimpan. Berlaku pada generate payroll berikutnya.');
    }

    public function karyawanDestroy($id)
    {
        KomponenPayrollKaryawan::findOrFail($id)->delete();

        return redirect()->back()->with('success', 'Komponen karyawan dilepas.');
    }
}
