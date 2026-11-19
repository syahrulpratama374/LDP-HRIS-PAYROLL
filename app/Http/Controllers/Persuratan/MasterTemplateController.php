<?php

namespace App\Http\Controllers\Persuratan;

use App\Http\Controllers\Controller;
use App\Models\MasterTemplateSurat;
use App\Models\RuteApprovalTemplate;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MasterTemplateController extends Controller
{
    public function index()
    {
        $templates = MasterTemplateSurat::with('ruteApprovals.jabatan')->latest()->get();
        
        // Ambil semua jabatan dan urutkan berdasarkan ID
        $jabatans = \App\Models\Jabatan::orderBy('id', 'asc')->get(); 

        return Inertia::render('Persuratan/Template/Index', [
            'templates' => $templates,
            'jabatans'  => $jabatans,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'nama_template' => 'required|string|max:255',
            // Segmen ke-2 nomor surat: tanpa '/' agar format nomor tidak rusak. Penerbit dipilih per surat.
            'kode_surat'    => ['required', 'string', 'max:50', 'regex:/^[A-Za-z0-9-]+$/'],
            'konten'        => 'required|string',
            
            'rute_approvals'              => 'nullable|array',
            'rute_approvals.*.urutan'     => 'required|integer',
            'rute_approvals.*.jabatan_id' => 'required|exists:jabatans,id',
            'rute_approvals.*.label_ttd'  => 'required|string|max:255',
        ], [
            'kode_surat.regex' => 'Kode surat hanya boleh berisi huruf, angka, dan tanda hubung (-).',
        ]);

        $template = MasterTemplateSurat::create([
            'nama_template' => $request->nama_template,
            'kode_surat'    => strtoupper(trim($request->kode_surat)),
            'konten'        => $request->konten,
            'is_active'     => true,
        ]);

        if ($request->has('rute_approvals')) {
            foreach ($request->rute_approvals as $rute) {
                RuteApprovalTemplate::create([
                    'template_id'    => $template->id,
                    'urutan_langkah' => $rute['urutan'],
                    'jabatan_id'     => $rute['jabatan_id'],
                    'label_ttd'      => $rute['label_ttd'],
                ]);
            }
        }

        return redirect()->back()->with('success', 'Master Template dan Rute Approval berhasil dibuat.');
    }
}