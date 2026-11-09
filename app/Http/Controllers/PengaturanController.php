<?php

namespace App\Http\Controllers;

use App\Models\Pengaturan;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PengaturanController extends Controller
{
    public function index()
    {
        // Ubah format data menjadi key-value (kunci => nilai) agar mudah dibaca di React
        $pengaturan = Pengaturan::all()->keyBy('kunci')->map(function ($item) {
            return $item->nilai;
        });

        return Inertia::render('Admin/Pengaturan/Index', [
            'pengaturan' => $pengaturan
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->except(['_token']);

        // Looping dan update setiap kunci yang dikirim dari frontend
        foreach ($data as $kunci => $nilai) {
            Pengaturan::where('kunci', $kunci)->update(['nilai' => $nilai]);
        }

        return redirect()->back()->with('success', 'Parameter sistem berhasil diperbarui.');
    }
}