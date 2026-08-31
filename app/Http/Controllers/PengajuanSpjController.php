<?php

namespace App\Http\Controllers;

use App\Models\PengajuanSpj;
use App\Models\KomponenBiayaSpj;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PengajuanSpjController extends Controller
{
    // [KARYAWAN] Menampilkan riwayat SPJ
    public function index(Request $request)
    {
        $karyawan = $request->user()->karyawan;
        $spj = [];
        
        if ($karyawan) {
            $spj = PengajuanSpj::with('komponenBiaya')
                ->where('karyawan_id', $karyawan->id)
                ->orderBy('created_at', 'desc')
                ->get();
        }

        return Inertia::render('Spj/Index', [
            'spj' => $spj
        ]);
    }

    // [KARYAWAN] Menampilkan form pengajuan SPJ (Dinamis)
    public function create()
    {
        return Inertia::render('Spj/Create');
    }

    // [KARYAWAN] Menyimpan data SPJ dan Rincian Biayanya
    public function store(Request $request)
    {
        $request->validate([
            'tujuan' => 'required|string|max:150',
            'keperluan' => 'required|string',
            'tgl_mulai' => 'required|date',
            'tgl_selesai' => 'required|date|after_or_equal:tgl_mulai',
            'komponen_biaya' => 'required|array|min:1',
            'komponen_biaya.*.jenis_biaya' => 'required|string',
            'komponen_biaya.*.nominal' => 'required|numeric|min:0',
            'komponen_biaya.*.keterangan' => 'nullable|string',
        ]);

        $karyawan = $request->user()->karyawan;

        if (!$karyawan) {
            return redirect()->back()->withErrors(['error' => 'Data kepegawaian tidak ditemukan.']);
        }

        // Kalkulasi total biaya secara otomatis dari array komponen
        $totalBiaya = collect($request->komponen_biaya)->sum('nominal');

        // 1. Simpan tabel induk (SPJ)
        $spj = PengajuanSpj::create([
            'karyawan_id' => $karyawan->id,
            'tujuan' => $request->tujuan,
            'keperluan' => $request->keperluan,
            'tgl_mulai' => $request->tgl_mulai,
            'tgl_selesai' => $request->tgl_selesai,
            'total_biaya' => $totalBiaya,
            'status_approval' => 'Pending',
            'sudah_dibayar' => false,
        ]);

        // 2. Simpan tabel anak (Rincian Komponen Biaya) menggunakan perulangan
        foreach ($request->komponen_biaya as $komponen) {
            KomponenBiayaSpj::create([
                'pengajuan_spj_id' => $spj->id,
                'jenis_biaya' => $komponen['jenis_biaya'],
                'nominal' => $komponen['nominal'],
                'keterangan' => $komponen['keterangan'] ?? null,
            ]);
        }

        return redirect()->route('spj.index')->with('success', 'Pengajuan Perjalanan Dinas (SPJ) berhasil dikirim.');
    }

    // [ADMIN/FINANCE] Menampilkan daftar seluruh pengajuan SPJ
    public function adminIndex()
    {
        $spj = PengajuanSpj::with(['karyawan.departemen', 'komponenBiaya'])
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('Spj/AdminIndex', [
            'spj' => $spj
        ]);
    }

    // [ADMIN/FINANCE] Mengubah status approval
    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status_approval' => 'required|in:Disetujui,Ditolak'
        ]);

        $spj = PengajuanSpj::findOrFail($id);
        $spj->update([
            'status_approval' => $request->status_approval
        ]);

        return redirect()->back()->with('success', 'Status pengajuan SPJ berhasil diperbarui.');
    }
}