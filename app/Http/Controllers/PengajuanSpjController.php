<?php

namespace App\Http\Controllers;

use App\Models\PengajuanSpj;
use App\Models\KomponenBiayaSpj;
use App\Models\Pengaturan;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PengajuanSpjController extends Controller
{
    // [KARYAWAN] Menampilkan riwayat SPJ
    public function index(Request $request)
    {
        $karyawan = $request->user()->karyawan;
        $spj = [];
        $adaUtangLaporan = false;
        
        if ($karyawan) {
            $spj = PengajuanSpj::with('komponenBiaya')
                ->where('karyawan_id', $karyawan->id)
                ->orderBy('created_at', 'desc')
                ->get();

            // Cek apakah ada SPJ disetujui yang tanggal selesainya sudah lewat tapi belum lapor
            foreach ($spj as $item) {
                if ($item->status_approval === 'Disetujui' && 
                    date('Y-m-d') > $item->tgl_selesai && 
                    empty($item->laporan_hasil)) {
                    
                    // Ubah status otomatis menjadi Menunggu Pelaporan
                    $item->update(['status_approval' => 'Menunggu Pelaporan']);
                    $adaUtangLaporan = true;
                } elseif ($item->status_approval === 'Menunggu Pelaporan') {
                    $adaUtangLaporan = true;
                }
            }
        }

        return Inertia::render('Spj/Index', [
            'spj' => $spj,
            'adaUtangLaporan' => $adaUtangLaporan // Penanda di React untuk disable tombol ajukan baru
        ]);
    }

    // [KARYAWAN] Menyimpan laporan Pasca-SPJ (Risalah & Bon)
    public function storeLaporan(Request $request, $id)
    {
        $request->validate([
            'laporan_hasil' => 'required|string',
            'file_bukti' => 'required|file|mimes:jpg,jpeg,png,pdf|max:2048',
        ]);

        $spj = PengajuanSpj::findOrFail($id);

        $filePath = null;
        if ($request->hasFile('file_bukti')) {
            $filePath = $request->file('file_bukti')->store('spj_bukti', 'public');
        }

        $spj->update([
            'laporan_hasil' => $request->laporan_hasil,
            'file_bukti_path' => $filePath,
            'status_approval' => 'Menunggu Validasi Finance',
        ]);

        return redirect()->route('spj.index')->with('success', 'Laporan perjalanan dinas dan bukti bon berhasil diunggah.');
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

        // Eager load relasi golongan untuk mengecek kode golongannya
        $karyawan = $request->user()->karyawan()->with('golongan')->first();

        if (!$karyawan) {
            return redirect()->back()->withErrors(['error' => 'Data kepegawaian tidak ditemukan.']);
        }

        // 1. Kalkulasi total biaya secara otomatis dari array komponen
        $totalBiaya = collect($request->komponen_biaya)->sum('nominal');

        // 2. Logika Plafon Dinamis Berdasarkan Golongan
        $kodeGolongan = $karyawan->golongan ? $karyawan->golongan->kode_golongan : 'DEFAULT';
        
        // Sistem mencari batas maksimal di tabel pengaturans (misal: kunci 'plafon_spj_G1A')
        $plafonSetting = Pengaturan::where('kunci', 'plafon_spj_' . $kodeGolongan)->value('nilai');
        
        // Jika HC/Finance belum mengatur plafon khusus golongan ini, gunakan default (contoh: Rp 1.500.000)
        $batasMaksimal = $plafonSetting ? (float) $plafonSetting : 1500000;

        if ($totalBiaya > $batasMaksimal) {
            return redirect()->back()->withErrors([
                'error' => 'Total pengajuan (Rp ' . number_format($totalBiaya, 0, ',', '.') . 
                           ') melebihi batas plafon SPJ untuk Golongan ' . $kodeGolongan . 
                           ' (Rp ' . number_format($batasMaksimal, 0, ',', '.') . ').'
            ]);
        }

        // 3. Simpan tabel induk (SPJ)
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

        // 4. Simpan tabel anak (Rincian Komponen Biaya) menggunakan perulangan
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