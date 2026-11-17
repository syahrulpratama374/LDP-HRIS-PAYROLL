<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\OtorisasiApprovalAtasan;
use App\Models\PengajuanLembur;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PengajuanLemburController extends Controller
{
    use OtorisasiApprovalAtasan;

    public const MAKS_DURASI_JAM = 12;

    /** Durasi menit antara dua jam H:i; bila selesai < mulai dihitung lintas hari. Null bila format tidak valid. */
    public static function durasiMenit(string $mulai, string $selesai): ?int
    {
        if (! preg_match('/^\d{2}:\d{2}$/', $mulai) || ! preg_match('/^\d{2}:\d{2}$/', $selesai)) {
            return null;
        }
        [$hm, $mm] = array_map('intval', explode(':', $mulai));
        [$hs, $ms] = array_map('intval', explode(':', $selesai));
        $durasi = ($hs * 60 + $ms) - ($hm * 60 + $mm);

        return $durasi < 0 ? $durasi + 24 * 60 : $durasi;
    }

    // Menampilkan riwayat lembur milik karyawan yang sedang login
    public function index(Request $request)
    {
        $user = $request->user();
        $karyawan = $user->karyawan;

        $riwayatLembur = [];
        if ($karyawan) {
            $riwayatLembur = PengajuanLembur::where('karyawan_id', $karyawan->id)
                ->orderBy('tanggal', 'desc') 
                ->orderBy('created_at', 'desc')
                ->get();
        }

        return Inertia::render('Lembur/Index', [
            'riwayatLembur' => $riwayatLembur
        ]);
    }

    // Menampilkan form pengajuan lembur
    public function create(Request $request)
    {
        return Inertia::render('Lembur/Create');
    }

    // Menyimpan data lembur yang dikirim karyawan
    public function store(Request $request)
    {
        // Lembur boleh lintas tengah malam (mis. 22:00 → 02:00): jam_selesai < jam_mulai berarti +1 hari
        $request->validate([
            'tanggal' => 'required|date',
            'jam_mulai' => 'required|date_format:H:i',
            'jam_selesai' => [
                'required',
                'date_format:H:i',
                function ($attribute, $value, $fail) use ($request) {
                    $durasi = self::durasiMenit((string) $request->jam_mulai, (string) $value);
                    if ($durasi === null) {
                        return;
                    }
                    if ($durasi === 0) {
                        $fail('Jam selesai tidak boleh sama dengan jam mulai.');
                    } elseif ($durasi > self::MAKS_DURASI_JAM * 60) {
                        $fail('Durasi lembur maksimal ' . self::MAKS_DURASI_JAM . ' jam.');
                    }
                },
            ],
            'deskripsi_pekerjaan' => 'required|string|max:500',
        ]);

        $user = $request->user();
        $karyawan = $user->karyawan;

        if (!$karyawan) {
            return redirect()->back()->withErrors(['error' => 'Data kepegawaian tidak ditemukan.']);
        }

        // Proteksi pencegahan lembur ganda di tanggal yang sama
        $cekLembur = PengajuanLembur::where('karyawan_id', $karyawan->id)
            ->where('tanggal', $request->tanggal)
            ->exists();

        if ($cekLembur) {
            return redirect()->back()->withErrors(['error' => 'Anda sudah memiliki pengajuan lembur di tanggal tersebut.']);
        }

        PengajuanLembur::create([
            'karyawan_id' => $karyawan->id,
            'tanggal' => $request->tanggal,
            'jam_mulai' => $request->jam_mulai,
            'jam_selesai' => $request->jam_selesai,
            'deskripsi_pekerjaan' => $request->deskripsi_pekerjaan,
            'status_approval' => 'Pending',
        ]);

        return redirect()->route('lembur.index')->with('success', 'Pengajuan lembur berhasil dikirim dan menunggu persetujuan.');
    }
// ==========================================
    // AREA KHUSUS ADMIN / HC / SUPERVISOR
    // ==========================================

    // [SUPERVISOR/ADMIN] Menampilkan daftar lembur bawahan
    public function adminIndex(Request $request)
    {
        $user = $request->user();
        $karyawan = $user->karyawan;

        $query = PengajuanLembur::with(['karyawan.departemen', 'karyawan.jabatan']);

        // Logika Hierarki & Eskalasi
        if ($user->role_id == 5) {
            if (!$karyawan) {
                abort(403, 'Akses Ditolak: Anda tidak terdaftar sebagai Karyawan.');
            }
            
            $karyawanId = $karyawan->id;
            $hariIni = \Carbon\Carbon::now()->toDateString();

            $bawahanIds = \App\Models\Karyawan::where('atasan_id', $karyawanId)->pluck('id')->toArray();

            $pemberiDelegasiIds = \App\Models\DelegasiWewenang::where('penerima_id', $karyawanId)
                ->where('status', 'Aktif')
                ->whereDate('tgl_mulai', '<=', $hariIni)
                ->whereDate('tgl_selesai', '>=', $hariIni)
                ->pluck('pemberi_id')
                ->toArray();

            if (!empty($pemberiDelegasiIds)) {
                $bawahanTitipanIds = \App\Models\Karyawan::whereIn('atasan_id', $pemberiDelegasiIds)->pluck('id')->toArray();
                $bawahanIds = array_unique(array_merge($bawahanIds, $bawahanTitipanIds));
            }

            $query->whereIn('karyawan_id', $bawahanIds);
        }

        $lemburs = $query->orderByRaw("FIELD(status_approval, 'Pending') DESC")
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('Lembur/AdminIndex', [
            'lemburs' => $lemburs
        ]);
    }

    // [SUPERVISOR/ADMIN] Mengubah status approval (Disetujui / Ditolak)
    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status_approval' => 'required|in:Disetujui,Ditolak'
        ]);

        $lembur = PengajuanLembur::with('karyawan')->findOrFail($id);

        $this->pastikanBolehMemproses($request->user(), $lembur->karyawan);

        if ($lembur->status_approval !== 'Pending') {
            return redirect()->back()->withErrors(['error' => "Pengajuan lembur berstatus {$lembur->status_approval} dan tidak dapat diproses ulang."]);
        }

        $lembur->update([
            'status_approval' => $request->status_approval
        ]);

        $pesan = $request->status_approval === 'Disetujui' 
            ? 'Pengajuan lembur berhasil disetujui.' 
            : 'Pengajuan lembur telah ditolak.';

        return redirect()->back()->with('success', $pesan);
    }
}