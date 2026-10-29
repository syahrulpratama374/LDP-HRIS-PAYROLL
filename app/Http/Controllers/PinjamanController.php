<?php

namespace App\Http\Controllers;

use App\Models\PinjamanKaryawan;
use App\Models\CicilanPinjaman;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class PinjamanController extends Controller
{
    public function index(Request $request)
    {
        $karyawan = $request->user()->karyawan;
        $pinjaman = [];
        
        if ($karyawan) {
            $pinjaman = PinjamanKaryawan::with(['cicilans', 'departemen'])
                ->where('karyawan_id', $karyawan->id)
                ->orderBy('created_at', 'desc')
                ->get();
        }

        return Inertia::render('Pinjaman/Index', [
            'pinjaman' => $pinjaman
        ]);
    }

    public function create(Request $request)
    {
        $karyawan = $request->user()->karyawan;
        return Inertia::render('Pinjaman/Create', [
            'karyawan' => $karyawan,
            'departemen' => $karyawan ? $karyawan->departemen : null
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'jenis_kasbon' => 'required|in:Finance,Divisi',
            'total_pinjaman' => 'required|numeric|min:50000',
            'tenor_bulan' => 'required|integer|min:1|max:12',
            'alasan_pinjaman' => 'required|string|max:500',
        ]);

        $karyawan = $request->user()->karyawan;

        if (!$karyawan) {
            return redirect()->back()->withErrors(['error' => 'Data kepegawaian tidak ditemukan.']);
        }

        PinjamanKaryawan::create([
            'karyawan_id' => $karyawan->id,
            'jenis_kasbon' => $request->jenis_kasbon,
            'departemen_id' => $request->jenis_kasbon === 'Divisi' ? $karyawan->departemen_id : null,
            'total_pinjaman' => $request->total_pinjaman,
            'tenor_bulan' => $request->jenis_kasbon === 'Divisi' ? 1 : $request->tenor_bulan, // Kasbon divisi biasanya 1 bulan
            'sisa_pinjaman' => $request->total_pinjaman,
            'alasan_pinjaman' => $request->alasan_pinjaman,
            'status' => 'Pending',
        ]);

        return redirect()->route('pinjaman.index')->with('success', 'Pengajuan kasbon berhasil dikirim.');
    }

    public function adminIndex(Request $request)
    {
        $user = $request->user();
        
        if (!in_array($user->role_id, [1, 3, 4, 5])) {
            abort(403, 'Akses Ditolak.');
        }

        $query = PinjamanKaryawan::with(['karyawan.departemen', 'departemen', 'cicilans']);

        // Jika SPV / Kepala Divisi, tampilkan kasbon divisi mereka
        if ($user->role_id == 5 && $user->karyawan) {
            $query->where('jenis_kasbon', 'Divisi')
                  ->where('departemen_id', $user->karyawan->departemen_id);
        }

        $pinjaman = $query->orderByRaw("FIELD(status, 'Pending', 'Berjalan', 'Lunas', 'Ditolak')")
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('Pinjaman/AdminIndex', [
            'pinjaman' => $pinjaman,
            'userRole' => $user->role_id
        ]);
    }

    // app/Http/Controllers/PinjamanController.php

public function updateStatus(Request $request, $id)
{
    $request->validate([
        'status' => 'required|in:Disetujui Atasan,Berjalan,Ditolak'
    ]);

    $user = $request->user();
    $pinjaman = PinjamanKaryawan::findOrFail($id);
    $targetStatus = $request->status;

    DB::beginTransaction();
    try {
        // PENGECEKAN HAK AKSES APPROVAL 2 LEVEL
        if ($user->role_id == 5) { 
            // SPV / Kepala Divisi hanya bisa menyetujui tahap awal
            if ($pinjaman->jenis_kasbon === 'Divisi') {
                $pinjaman->status = 'Berjalan'; // Kasbon divisi langsung cair dari petty cash
            } else {
                $pinjaman->status = 'Disetujui Atasan'; // Kasbon finance menunggu verifikasi Finance
            }
            $pinjaman->approved_atasan_at = Carbon::now();
        } elseif (in_array($user->role_id, [1, 4])) { 
            // Finance / Admin melakukan approval final & pencairan dana
            $pinjaman->status = $targetStatus;
        }

        if ($targetStatus === 'Ditolak') {
            $pinjaman->status = 'Ditolak';
        }

        $pinjaman->save();

        // GENERATE JADWAL CICILAN SAAT STATUS MENJADI 'BERJALAN'
        if ($pinjaman->status === 'Berjalan' && $pinjaman->cicilans()->count() === 0) {
            $nominalCicilan = $pinjaman->total_pinjaman / $pinjaman->tenor_bulan;
            $startDate = Carbon::now();

            for ($i = 0; $i < $pinjaman->tenor_bulan; $i++) {
                CicilanPinjaman::create([
                    'pinjaman_id' => $pinjaman->id,
                    'nominal_cicilan' => $nominalCicilan,
                    'jatuh_tempo' => $startDate->copy()->addMonths($i + 1)->setDate($startDate->year, $startDate->month, 25),
                    'status_bayar' => 'Belum Lunas',
                    'metode_pelunasan' => 'Potong Gaji'
                ]);
            }
        }

        DB::commit();
        return redirect()->back()->with('success', 'Status pengajuan kasbon berhasil diperbarui.');

    } catch (\Exception $e) {
        DB::rollBack();
        return back()->withErrors(['error' => 'Gagal memproses pinjaman: ' . $e->getMessage()]);
    }
}

    // Pelunasan Manual (Transfer Direct / Tunai)
    public function bayarManual(Request $request, $cicilanId)
    {
        $request->validate([
            'bukti_transfer' => 'required|image|mimes:jpeg,png,jpg|max:2048'
        ]);

        $cicilan = CicilanPinjaman::findOrFail($cicilanId);
        $pinjaman = $cicilan->pinjaman;

        if ($request->hasFile('bukti_transfer')) {
            $path = $request->file('bukti_transfer')->store('bukti_kasbon', 'public');

            $cicilan->update([
                'status_bayar' => 'Lunas',
                'metode_pelunasan' => 'Tunai / Transfer',
                'bukti_transfer' => $path,
                'tgl_bayar' => Carbon::now()
            ]);

            // Update Sisa Hutang pada Pinjaman
            $sisaBaru = max(0, $pinjaman->sisa_pinjaman - $cicilan->nominal_cicilan);
            $pinjaman->update([
                'sisa_pinjaman' => $sisaBaru,
                'status' => $sisaBaru <= 0 ? 'Lunas' : 'Berjalan'
            ]);
        }

        return redirect()->back()->with('success', 'Pembayaran angsuran berhasil diunggah.');
    }
}