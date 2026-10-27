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
        $jabatans  = \App\Models\Jabatan::all(); 

        return Inertia::render('Persuratan/Template/Index', [
            'templates' => $templates,
            'jabatans'  => $jabatans, // Kirim data jabatan ke React
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'nama_template' => 'required|string|max:255',
            'kode_surat'    => 'required|string|max:50', // Contoh: SPJ, SKEP
            'pembuat_kode'  => 'required|string|max:50', // Contoh: LDP-HC
            'konten'        => 'required|string', // Isi dasar HTML
            
            // Validasi Input Array Rute dari React Frontend
            'rute_approvals'              => 'nullable|array',
            'rute_approvals.*.urutan'     => 'required|integer',
            'rute_approvals.*.jabatan_id' => 'required|exists:jabatans,id',
            'rute_approvals.*.label_ttd'  => 'required|string|max:255',
        ]);

        $template = MasterTemplateSurat::create([
            'nama_template' => $request->nama_template,
            'kode_surat'    => $request->kode_surat,
            'pembuat_kode'  => $request->pembuat_kode,
            'konten'        => $request->konten,
            'is_active'     => true,
        ]);

        // Simpan Cetak Biru Rute Approval Bertingkat
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