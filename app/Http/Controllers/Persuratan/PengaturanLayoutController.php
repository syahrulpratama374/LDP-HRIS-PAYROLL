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
            'kota_surat'      => 'required|string|max:100',
            'logo_header'     => 'nullable|image|mimes:png,jpg,jpeg|max:2048',
            'watermark'       => 'nullable|image|mimes:png,jpg,jpeg|max:2048',
            'banner_footer'   => 'nullable|image|mimes:png,jpg,jpeg|max:2048',
            'latar_kop'       => 'nullable|image|mimes:png,jpg,jpeg|max:5120',
            'logo_iso'        => 'nullable|array|max:4',
            'logo_iso.*'      => 'image|mimes:png,jpg,jpeg|max:2048',
        ]);

        // Setiap simpan membuat baris layout baru. Gambar yang tidak diunggah ulang diwarisi dari
        // layout aktif sebelumnya, agar mengunggah satu aset tidak menghapus aset lainnya.
        $sebelumnya = PengaturanSuratLayout::where('is_active', true)->latest('id')->first();

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
            'kota_surat'      => $request->kota_surat,
            'is_active'       => $request->is_active ?? true,
            'logo_header_path'   => $sebelumnya?->logo_header_path,
            'watermark_path'     => $sebelumnya?->watermark_path,
            'banner_footer_path' => $sebelumnya?->banner_footer_path,
            'logo_iso_paths'     => $sebelumnya?->logo_iso_paths,
            'latar_kop_path'     => $sebelumnya?->latar_kop_path,
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
        if ($request->hasFile('latar_kop')) {
            $data['latar_kop_path'] = $request->file('latar_kop')->store('persuratan/layout', 'public');
        }
        // Unggahan logo ISO menggantikan seluruh daftar logo ISO sebelumnya
        if ($request->hasFile('logo_iso')) {
            $data['logo_iso_paths'] = collect($request->file('logo_iso'))
                ->map(fn ($file) => $file->store('persuratan/layout', 'public'))
                ->values()
                ->all();
        }

        PengaturanSuratLayout::create($data);

        return redirect()->back()->with('success', 'Aset Layout Surat Perusahaan berhasil disimpan dan diaktifkan.');
    }
}