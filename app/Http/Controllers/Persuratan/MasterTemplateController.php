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
        return Inertia::render('Persuratan/MasterTemplate/Index', [
            'templates' => $templates
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'nama_template' => 'required|string|max:255',
            'kode_surat' => 'required|string|max:50|unique:master_template_surats,kode_surat',
            'konten' => 'required|string',
            'is_active' => 'boolean',
        ]);

        MasterTemplateSurat::create($request->all());

        return back()->with('success', 'Template surat berhasil ditambahkan.');
    }

    public function update(Request $request, $id)
    {
        $template = MasterTemplateSurat::findOrFail($id);

        $request->validate([
            'nama_template' => 'required|string|max:255',
            'kode_surat' => 'required|string|max:50|unique:master_template_surats,kode_surat,' . $id,
            'konten' => 'required|string',
            'is_active' => 'boolean',
        ]);

        $template->update($request->all());

        return back()->with('success', 'Template surat berhasil diperbarui.');
    }

    public function destroy($id)
    {
        MasterTemplateSurat::findOrFail($id)->delete();
        return back()->with('success', 'Template surat berhasil dihapus.');
    }
}   