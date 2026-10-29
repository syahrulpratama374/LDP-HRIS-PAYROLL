<?php

namespace App\Http\Controllers;

use App\Models\PinjamanKaryawan;
use App\Models\CicilanPinjaman;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

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

        // PERBAIKAN: departemen_id tetap disimpan agar Atasan Divisi dapat memfilter pengajuan dari anggotanya
        PinjamanKaryawan::create([
            'karyawan_id' => $karyawan->id,
            'jenis_kasbon' => $request->jenis_kasbon,
            'departemen_id' => $karyawan->departemen_id, 
            'total_pinjaman' => $request->total_pinjaman,
            'tenor_bulan' => $request->jenis_kasbon === 'Divisi' ? 1 : $request->tenor_bulan,
            'sisa_pinjaman' => $request->total_pinjaman,
            'alasan_pinjaman' => $request->alasan_pinjaman,
            'status' => 'Pending',
        ]);

        return redirect()->route('pinjaman.index')->with('success', 'Pengajuan kasbon berhasil dikirim.');
    }

    public function adminIndex(Request $request)
    {
        $user = $request->user();
        $query = PinjamanKaryawan::with(['karyawan.departemen', 'cicilans']);

        // 1. ATASAN / SPV DIVISI (Role 5)
        if ($user->role_id == 5) {
            $deptId = $user->karyawan ? $user->karyawan->departemen_id : null;
            if ($deptId) {
                $query->where('departemen_id', $deptId);
            }
        }

        // 2. FINANCE (Role 4)
        if ($user->role_id == 4) {
            $query->where(function ($q) {
                $q->where('jenis_kasbon', 'Divisi')
                  ->orWhere(function ($sub) {
                      $sub->where('jenis_kasbon', 'Finance')
                          ->whereIn('status', ['Disetujui Atasan', 'Berjalan', 'Lunas', 'Ditolak']);
                  });
            });
        }

        // Role 1 (Super Admin) melihat seluruh data tanpa filter

        $pinjaman = $query->orderBy('created_at', 'desc')->get();

        return Inertia::render('Pinjaman/AdminIndex', [
            'pinjaman' => $pinjaman,
            'userRole' => (int) $user->role_id
        ]);
    }

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
            if ($user->role_id == 5) { 
                if ($pinjaman->jenis_kasbon === 'Divisi') {
                    $pinjaman->status = 'Berjalan';
                } else {
                    $pinjaman->status = 'Disetujui Atasan';
                }
                $pinjaman->approved_atasan_at = Carbon::now();
            } elseif (in_array($user->role_id, [1, 4])) { 
                $pinjaman->status = $targetStatus;
            }

            if ($targetStatus === 'Ditolak') {
                $pinjaman->status = 'Ditolak';
            }

            $pinjaman->save();

            // Generate jadwal angsuran saat status menjadi 'Berjalan'
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

            // PERBAIKAN: Perhitungan matematika sisa pinjaman
            $sisaBaru = max(0, $pinjaman->sisa_pinjaman - $cicilan->nominal_cicilan);
            $pinjaman->update([
                'sisa_pinjaman' => $sisaBaru,
                'status' => $sisaBaru <= 0 ? 'Lunas' : 'Berjalan'
            ]);
        }

        return redirect()->back()->with('success', 'Pembayaran angsuran berhasil diunggah.');
    }

    public function uploadBuktiBayar(Request $request, $cicilanId)
    {
        $request->validate([
            'bukti_transfer' => 'required|image|mimes:jpeg,png,jpg|max:2048'
        ]);

        $cicilan = CicilanPinjaman::findOrFail($cicilanId);

        if ($request->hasFile('bukti_transfer')) {
            $path = $request->file('bukti_transfer')->store('bukti_kasbon', 'public');

            $cicilan->update([
                'status_bayar' => 'Menunggu Validasi',
                'metode_pelunasan' => 'Tunai / Transfer',
                'bukti_transfer' => $path,
                'tgl_bayar' => Carbon::now()
            ]);
        }

        return redirect()->back()->with('success', 'Bukti pembayaran berhasil diunggah dan menunggu verifikasi.');
    }

    public function verifikasiPelunasan(Request $request, $cicilanId)
    {
        $request->validate([
            'status_verifikasi' => 'required|in:Lunas,Ditolak'
        ]);

        $cicilan = CicilanPinjaman::findOrFail($cicilanId);
        $pinjaman = $cicilan->pinjaman;

        DB::beginTransaction();
        try {
            if ($request->status_verifikasi === 'Lunas') {
                $cicilan->update(['status_bayar' => 'Lunas']);

                // PERBAIKAN: Perhitungan matematika sisa pinjaman
                $sisaBaru = max(0, $pinjaman->sisa_pinjaman - $cicilan->nominal_cicilan);
                $pinjaman->update([
                    'sisa_pinjaman' => $sisaBaru,
                    'status' => $sisaBaru <= 0 ? 'Lunas' : 'Berjalan'
                ]);
            } else {
                $cicilan->update([
                    'status_bayar' => 'Belum Lunas',
                    'metode_pelunasan' => 'Potong Gaji',
                    'bukti_transfer' => null
                ]);
            }

            DB::commit();
            return redirect()->back()->with('success', 'Verifikasi pembayaran berhasil diproses.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Gagal verifikasi pembayaran: ' . $e->getMessage()]);
        }
    }
}