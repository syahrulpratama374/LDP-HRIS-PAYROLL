<?php

namespace App\Http\Controllers\Persuratan;

use App\Http\Controllers\Controller;
use App\Models\PengaturanSuratLayout;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PengaturanLayoutController extends Controller
{
    public function index()
    {
        $layouts = PengaturanSuratLayout::latest()->get();
        return Inertia::render('Persuratan/Layout/Index', [
            'layouts' => $layouts
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'tahun_periode'   => 'required|string|size:4',
            'nama_perusahaan' => 'required|string|max:255',
            'slogan'          => 'nullable|string|max:255',
            'alamat'          => 'nullable|string',
            'telepon'         => 'nullable|string|max:50',
            'email'           => 'nullable|email|max:100',
            'website'         => 'nullable|string|max:100',
            'logo_header'     => 'nullable|image|mimes:png,jpg,jpeg|max:2048',
            'watermark'       => 'nullable|image|mimes:png,jpg,jpeg|max:2048',
            'banner_footer'   => 'nullable|image|mimes:png,jpg,jpeg|max:2048',
        ]);

        // Jika layout baru diaktifkan, matikan status aktif layout periode sebelumnya
        if ($request->is_active) {
            PengaturanSuratLayout::query()->update(['is_active' => false]);
        }

        $data = [
            'tahun_periode'   => $request->tahun_periode,
            'nama_perusahaan' => $request->nama_perusahaan,
            'slogan'          => $request->slogan,
            'alamat'          => $request->alamat,
            'telepon'         => $request->telepon,
            'email'           => $request->email,
            'website'         => $request->website,
            'is_active'       => $request->is_active ?? true,
        ];

        if ($request->hasFile('logo_header')) {
            $data['logo_header_path'] = $request->file('logo_header')->store('persuratan/layout', 'public');
        }
        if ($request->hasFile('watermark')) {
            $data['watermark_path'] = $request->file('watermark')->store('persuratan/layout', 'public');
        }
        if ($request->hasFile('banner_footer')) {
            $data['banner_footer_path'] = $request->file('banner_footer')->store('persuratan/layout', 'public');
        }

        PengaturanSuratLayout::create($data);

        return redirect()->back()->with('success', 'Aset Layout Surat Perusahaan berhasil disimpan dan diaktifkan.');
    }
}