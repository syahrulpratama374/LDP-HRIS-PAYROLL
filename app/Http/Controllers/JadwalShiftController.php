<?php

namespace App\Http\Controllers;

use App\Models\Karyawan;
use App\Models\MasterShift;
use App\Models\JadwalShiftKaryawan;
use App\Models\Departemen;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Inertia\Inertia;

class JadwalShiftController extends Controller
{
    public function index(Request $request)
    {
        $bulan = (int) $request->input('bulan', Carbon::now()->month);
        $tahun = (int) $request->input('tahun', Carbon::now()->year);
        $departemenId = $request->input('departemen_id');

        // Ambil Departemen yang Wajib Logbook / Shift (NOC)
        $departemenNoc = Departemen::where('is_wajib_logbook', true)->pluck('id');

        // Query Karyawan (Default: Departemen NOC)
        $queryKaryawan = Karyawan::with(['departemen', 'jabatan'])
            ->where('status_aktif', true);

        if ($departemenId) {
            $queryKaryawan->where('departemen_id', $departemenId);
        } else {
            $queryKaryawan->whereIn('departemen_id', $departemenNoc);
        }

        $karyawans = $queryKaryawan->orderBy('nama_lengkap')->get();

        // Hitung Jumlah Hari dalam Bulan & Tahun Terpilih
        $jumlahHari = Carbon::createFromDate($tahun, $bulan, 1)->daysInMonth;
        $tanggalAwal = Carbon::createFromDate($tahun, $bulan, 1)->toDateString();
        $tanggalAkhir = Carbon::createFromDate($tahun, $bulan, $jumlahHari)->toDateString();

        // Ambil Data Jadwal Shift yang Sudah Ada di Database
        $jadwalExisting = JadwalShiftKaryawan::whereBetween('tanggal', [$tanggalAwal, $tanggalAkhir])
            ->get()
            ->groupBy('karyawan_id');

        // Map data jadwal ke format key `karyawan_id_YYYY-MM-DD` => `shift_id`
        $rosterMatrix = [];
        foreach ($jadwalExisting as $karyawanId => $jadwals) {
            foreach ($jadwals as $j) {
                $rosterMatrix["{$karyawanId}_{$j->tanggal}"] = $j->shift_id;
            }
        }

        return Inertia::render('Kepegawaian/JadwalShift/Index', [
            'karyawans' => $karyawans,
            'shifts' => MasterShift::orderBy('jam_masuk')->get(),
            'departemens' => Departemen::where('is_wajib_logbook', true)->get(['id', 'nama_departemen']),
            'rosterMatrix' => $rosterMatrix,
            'filters' => [
                'bulan' => $bulan,
                'tahun' => $tahun,
                'departemen_id' => $departemenId ?? ''
            ],
            'jumlahHari' => $jumlahHari
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'roster' => 'required|array',
            'roster.*.karyawan_id' => 'required|exists:karyawans,id',
            'roster.*.tanggal' => 'required|date',
            'roster.*.shift_id' => 'nullable|exists:master_shifts,id',
        ]);

        foreach ($request->roster as $item) {
            if (empty($item['shift_id'])) {
                // Jika shift dikosongkan/dihapus, hapus record dari database
                JadwalShiftKaryawan::where('karyawan_id', $item['karyawan_id'])
                    ->where('tanggal', $item['tanggal'])
                    ->delete();
            } else {
                // Update atau buat plot shift baru
                JadwalShiftKaryawan::updateOrCreate(
                    [
                        'karyawan_id' => $item['karyawan_id'],
                        'tanggal' => $item['tanggal'],
                    ],
                    [
                        'shift_id' => $item['shift_id']
                    ]
                );
            }
        }

        return back()->with('success', 'Roster Jadwal Shift berhasil disimpan!');
    }
}