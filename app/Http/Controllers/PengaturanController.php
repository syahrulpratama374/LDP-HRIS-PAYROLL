<?php

namespace App\Http\Controllers;

use App\Models\Pengaturan;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PengaturanController extends Controller
{
    public function index()
    {
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

        foreach ($data as $kunci => $nilai) {
            Pengaturan::updateOrCreate(
                ['kunci' => $kunci],
                ['nilai' => $nilai ?? '']
            );
        }

        return redirect()->back()->with('success', 'Parameter sistem berhasil diperbarui.');
    }
}