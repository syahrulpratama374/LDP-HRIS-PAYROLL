<?php

namespace App\Http\Controllers\Persuratan;

use App\Http\Controllers\Controller;
use App\Models\MasterTemplateSurat;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MasterTemplateController extends Controller
{
    public function index()
    {
        $templates = MasterTemplateSurat::latest()->get();
        // Pastikan path foldernya sesuai dengan folder di resources/js/Pages
        return Inertia::render('Persuratan/MasterTemplate/Index', [
            'templates' => $templates
        ]);
    }

    // 1. TAMBAHAN: Method create untuk membuka halaman Editor React Quill
    public function create()
    {
        return Inertia::render('Persuratan/MasterTemplate/Create');
    }

    public function store(Request $request)
    {
        $request->validate([
            'nama_template' => 'required|string|max:255',
            'kode_surat'    => 'required|string|max:50|unique:master_template_surats,kode_surat',
            // WAJIB DITAMBAHKAN: Untuk logika Approval Direktur & Kode Pembuat (Kop Surat)
            'kategori_alur' => 'required|in:Approval_Direksi,Hanya_Notifikasi',
            'pembuat_kode'  => 'required|string|max:50',
            'konten'        => 'required|string',
            'is_active'     => 'boolean',
        ]);

        MasterTemplateSurat::create($request->all());

        // Diarahkan kembali ke halaman index setelah selesai dibuat dari halaman Create
        return redirect()->route('template.index')
                         ->with('success', 'Template surat berhasil ditambahkan.');
    }

    // 2. TAMBAHAN: Method edit untuk membuka halaman Editor saat mau revisi template
    public function edit($id)
    {
        $template = MasterTemplateSurat::findOrFail($id);
        return Inertia::render('Persuratan/MasterTemplate/Edit', [
            'template' => $template
        ]);
    }

    public function update(Request $request, $id)
    {
        $template = MasterTemplateSurat::findOrFail($id);

        $request->validate([
            'nama_template' => 'required|string|max:255',
            'kode_surat'    => 'required|string|max:50|unique:master_template_surats,kode_surat,' . $id,
            // WAJIB DITAMBAHKAN:
            'kategori_alur' => 'required|in:Approval_Direksi,Hanya_Notifikasi',
            'pembuat_kode'  => 'required|string|max:50',
            'konten'        => 'required|string',
            'is_active'     => 'boolean',
        ]);

        $template->update($request->all());

        return redirect()->route('template.index')
                         ->with('success', 'Template surat berhasil diperbarui.');
    }

    public function destroy($id)
    {
        MasterTemplateSurat::findOrFail($id)->delete();
        return back()->with('success', 'Template surat berhasil dihapus.');
    }
}