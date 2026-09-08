<?php

namespace App\Http\Controllers;

use App\Models\PengajuanCuti;
use App\Models\SaldoCuti;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class PengajuanCutiController extends Controller
{
    // Menampilkan riwayat cuti/izin milik karyawan yang sedang login
    public function index()
    {
        $karyawan = Auth::user()->karyawan;
        
        $riwayatCuti = PengajuanCuti::where('karyawan_id', $karyawan->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('Kepegawaian/Cuti/Index', [
            'riwayatCuti' => $riwayatCuti
        ]);
    }

    // Menampilkan form pengajuan cuti baru beserta saldo cuti reaktif
    public function create()
    {
        $karyawan = Auth::user()->karyawan;
        $tahunSekarang = date('Y');
        
        // Membaca saldo cuti tahun ini
        $saldoCuti = SaldoCuti::where('karyawan_id', $karyawan->id)
            ->where('tahun_periode', $tahunSekarang)
            ->first();

        // Jika master data saldo belum di-generate oleh HC, berikan fallback nilai default
        if (!$saldoCuti) {
            $saldoCuti = [
                'hak_cuti_tahunan' => 12,
                'cuti_terpakai' => 0
            ];
        }

        return Inertia::render('Kepegawaian/Cuti/Create', [
            'saldoCuti' => $saldoCuti
        ]);
    }

    // Menyimpan data pengajuan cuti ke database
    public function store(Request $request)
    {
        $request->validate([
            'jenis_cuti' => 'required|string',
            'tanggal_mulai' => 'required|date',
            'tanggal_selesai' => 'required|date|after_or_equal:tanggal_mulai',
            'alasan' => 'required|string|max:255',
            'dokumen_bukti' => 'nullable|file|mimes:jpg,png,pdf|max:2048',
        ]);

        $karyawan = Auth::user()->karyawan;
        $dokumenPath = null;

        if ($request->hasFile('dokumen_bukti')) {
            $dokumenPath = $request->file('dokumen_bukti')->store('dokumen_cuti', 'public');
        }

        PengajuanCuti::create([
            'karyawan_id' => $karyawan->id,
            'jenis_cuti' => $request->jenis_cuti,
            'tanggal_mulai' => $request->tanggal_mulai,
            'tanggal_selesai' => $request->tanggal_selesai,
            'alasan' => $request->alasan,
            'dokumen_bukti_path' => $dokumenPath,
            'status_approval' => 'Pending',
        ]);

        return redirect()->route('cuti.index')->with('success', 'Pengajuan berhasil dikirim dan menunggu persetujuan.');
    }

    // ==========================================
    // AREA KHUSUS ADMIN / HC / SUPERVISOR
    // ==========================================

    public function adminIndex()
    {
        $pengajuanCuti = PengajuanCuti::with(['karyawan.departemen', 'karyawan.jabatan'])
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return Inertia::render('Kepegawaian/Cuti/AdminIndex', [
            'pengajuanCuti' => $pengajuanCuti
        ]);
    }

    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status_approval' => 'required|in:Disetujui,Ditolak',
        ]);

        $cuti = PengajuanCuti::findOrFail($id);
        
        // Eksekusi Automasi HANYA jika status diubah menjadi "Disetujui"
        if ($request->status_approval === 'Disetujui' && $cuti->status_approval !== 'Disetujui') {
            
            // 1. Kalkulasi Total Hari Cuti
            $tanggalMulai = \Carbon\Carbon::parse($cuti->tanggal_mulai);
            $tanggalSelesai = \Carbon\Carbon::parse($cuti->tanggal_selesai);
            
            // Hitung selisih hari (ditambah 1 agar hari H terhitung penuh)
            $totalHari = $tanggalMulai->diffInDays($tanggalSelesai) + 1;
            $tahunSekarang = $tanggalMulai->year;

            // 2. Pemotongan Saldo Cuti Reaktif (Hanya untuk Cuti Tahunan)
     // 2. Pemotongan Saldo Cuti Reaktif (Hanya untuk Cuti Tahunan)
            if ($cuti->jenis_cuti === 'Tahunan') {
                // Cari saldo tahun ini, jika tidak ada, otomatis buatkan data baru!
                $saldo = \App\Models\SaldoCuti::firstOrCreate(
                    [
                        'karyawan_id' => $cuti->karyawan_id,
                        'tahun_periode' => $tahunSekarang
                    ],
                    [
                        'hak_cuti_tahunan' => 12, // Jatah default tahunan
                        'cuti_terpakai' => 0
                    ]
                );
                
                // Tambahkan jumlah cuti yang terpakai
                $saldo->increment('cuti_terpakai', $totalHari);
            }

            // 3. Inject Langsung ke Tabel Absensi (Menggantikan fungsi Cron Job)
            for ($i = 0; $i < $totalHari; $i++) {
                $tanggalAbsen = $tanggalMulai->copy()->addDays($i)->toDateString();
                
                \App\Models\Absensi::updateOrCreate(
                    [
                        'karyawan_id' => $cuti->karyawan_id,
                        'tanggal' => $tanggalAbsen
                    ],
                    [
                        'status' => 'Cuti',
                        'catatan' => 'Cuti: ' . $cuti->jenis_cuti,
                        // Null memastikan mesin absensi mengunci hari ini
                        'waktu_masuk' => null, 
                        'waktu_keluar' => null,
                    ]
                );
            }
        }

        // Simpan perubahan status final
        $cuti->update([
            'status_approval' => $request->status_approval
        ]);

        return redirect()->back()->with('success', 'Cuti disetujui! Saldo karyawan telah dipotong dan jadwal absensi otomatis diperbarui.');
    }
}