<?php

namespace App\Http\Controllers;

use App\Models\PenilaianKinerja;
use App\Models\Karyawan;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;

class PenilaianKinerjaController extends Controller
{
    // Mengambil Array ID Bawahan (Termasuk Eskalasi Delegasi/Plt)
    private function getBawahanIds($karyawan)
    {
        $karyawanId = $karyawan->id;
        $hariIni = Carbon::now()->toDateString();

        $bawahanIds = Karyawan::where('atasan_id', $karyawanId)->pluck('id')->toArray();

        // Cek jika SPV ini adalah Plt dari SPV lain
        $pemberiDelegasiIds = \App\Models\DelegasiWewenang::where('penerima_id', $karyawanId)
            ->where('status', 'Aktif')
            ->whereDate('tgl_mulai', '<=', $hariIni)
            ->whereDate('tgl_selesai', '>=', $hariIni)
            ->pluck('pemberi_id')
            ->toArray();

        if (!empty($pemberiDelegasiIds)) {
            $bawahanTitipanIds = Karyawan::whereIn('atasan_id', $pemberiDelegasiIds)->pluck('id')->toArray();
            $bawahanIds = array_unique(array_merge($bawahanIds, $bawahanTitipanIds));
        }

        return $bawahanIds;
    }

    // [HC / SUPERVISOR] Menampilkan riwayat penilaian
    public function index(Request $request)
    {
        $user = $request->user();
        $query = PenilaianKinerja::with(['karyawan', 'penilai']);

        // Jika Role SPV, hanya tampilkan hasil penilaian staf bawahannya
        if ($user->role_id == 5 && $user->karyawan) {
            $bawahanIds = $this->getBawahanIds($user->karyawan);
            $query->whereIn('karyawan_id', $bawahanIds);
        }

        $penilaians = $query->orderBy('periode_tahun', 'desc')
            ->orderBy('periode_bulan', 'desc')
            ->get();

        return Inertia::render('Kepegawaian/PenilaianKinerja/Index', [
            'penilaians' => $penilaians
        ]);
    }

    // [HC / SUPERVISOR] Menampilkan form input KPI
    public function create(Request $request)
    {
        $user = $request->user();
        $query = Karyawan::where('status_aktif', true);

        // Jika Role SPV, batasi dropdown HANYA untuk staf bawahannya
        if ($user->role_id == 5 && $user->karyawan) {
            $bawahanIds = $this->getBawahanIds($user->karyawan);
            $query->whereIn('id', $bawahanIds);
        }

        $karyawans = $query->orderBy('nama_lengkap')->get();

        return Inertia::render('Kepegawaian/PenilaianKinerja/Create', [
            'karyawans' => $karyawans
        ]);
    }

    // [HC / SUPERVISOR] Menyimpan skor KPI ke database
    public function store(Request $request)
    {
        $user = $request->user();
        
        // AUTO-ASSIGN: Jika SPV yang input, paksa ID penilai pakai ID dia. Jika Admin, ambil dari form.
        $penilaiId = ($user->role_id == 5) ? $user->karyawan->id : $request->penilai_id;

        $request->validate([
            'karyawan_id' => 'required|exists:karyawans,id',
            'periode_bulan' => 'required|integer|min:1|max:12',
            'periode_tahun' => 'required|integer|min:2020|max:2040',
            'skor_kpi' => 'required|numeric|min:0|max:100',
            'catatan_evaluasi' => 'required|string',
        ]);

        if ($request->karyawan_id == $penilaiId) {
            return back()->withErrors(['error' => 'Anda tidak bisa menilai diri sendiri.']);
        }

        // Mencegah input ganda di bulan & tahun yang sama untuk karyawan yang sama
        $cekExisting = PenilaianKinerja::where('karyawan_id', $request->karyawan_id)
            ->where('periode_bulan', $request->periode_bulan)
            ->where('periode_tahun', $request->periode_tahun)
            ->exists();

        if ($cekExisting) {
            return back()->withErrors(['error' => 'Karyawan ini sudah dinilai pada periode tersebut.']);
        }

        PenilaianKinerja::create([
            'karyawan_id' => $request->karyawan_id,
            'penilai_id' => $penilaiId,
            'periode_bulan' => $request->periode_bulan,
            'periode_tahun' => $request->periode_tahun,
            'skor_kpi' => $request->skor_kpi,
            'catatan_evaluasi' => $request->catatan_evaluasi,
        ]);

        return redirect()->route('admin.kinerja.index')->with('success', 'Skor Penilaian Kinerja (KPI) berhasil disimpan.');
    }

    // [HC / ADMIN] Menghapus data penilaian
    public function destroy($id)
    {
        PenilaianKinerja::findOrFail($id)->delete();
        return redirect()->back()->with('success', 'Data penilaian berhasil dihapus.');
    }
}