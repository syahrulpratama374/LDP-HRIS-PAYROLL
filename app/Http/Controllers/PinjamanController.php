<?php

namespace App\Http\Controllers;

use App\Models\PinjamanKaryawan;
use App\Models\CicilanPinjaman;
use App\Models\AuditTrail;
use App\Services\KasbonLimitService;
use App\Services\WhatsAppService;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class PinjamanController extends Controller
{
    public function __construct(private KasbonLimitService $limit)
    {
    }

    /** Kirim WhatsApp tanpa pernah menggagalkan transaksi utama. */
    private function notifikasiWa($karyawan, string $pesan): void
    {
        try {
            if ($karyawan && $karyawan->no_telp) {
                WhatsAppService::sendNotification($karyawan->no_telp, $pesan);
            }
        } catch (\Throwable $e) {
            Log::warning('Notifikasi WhatsApp kasbon gagal: ' . $e->getMessage());
        }
    }

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

        $plafon = $karyawan ? $this->limit->plafon($karyawan->id) : null;

        return Inertia::render('Pinjaman/Index', [
            'pinjaman'         => $pinjaman,
            'sisaLimitFinance' => $plafon['sisa_limit_finance'] ?? 0,
            'sisaLimitDivisi'  => $plafon['sisa_limit_divisi'] ?? 0,
        ]);
    }

    public function create(Request $request)
    {
        $karyawan = $request->user()->karyawan;
        $plafon = $karyawan ? $this->limit->plafon($karyawan->id) : null;

        return Inertia::render('Pinjaman/Create', [
            'karyawan'         => $karyawan,
            'departemen'       => $karyawan ? $karyawan->departemen : null,
            'plafon'           => $plafon,
            'sisaLimitFinance' => $plafon['sisa_limit_finance'] ?? 0,
            'sisaLimitDivisi'  => $plafon['sisa_limit_divisi'] ?? 0,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'jenis_kasbon'    => 'required|in:Finance,Divisi',
            'total_pinjaman'  => 'required|numeric|min:50000',
            'tenor_bulan'     => 'required|integer|min:1|max:12',
            'alasan_pinjaman' => 'required|string|max:500',
        ]);

        $karyawan = $request->user()->karyawan;
        if (!$karyawan) {
            return redirect()->back()->withErrors(['error' => 'Data kepegawaian tidak ditemukan.']);
        }

        $tenor = $request->jenis_kasbon === 'Divisi' ? 1 : (int) $request->tenor_bulan;

        try {
            $pinjaman = DB::transaction(function () use ($request, $karyawan, $tenor) {
                // Kunci baris karyawan agar pengajuan ganda bersamaan tidak lolos cek limit
                \App\Models\Karyawan::whereKey($karyawan->id)->lockForUpdate()->first();

                $hasil = $this->limit->evaluasi($karyawan->id, (float) $request->total_pinjaman, $tenor, null, $request->jenis_kasbon);
                if (!$hasil['layak']) {
                    throw new \DomainException(implode(' ', $hasil['alasan']));
                }

                // departemen_id tetap disimpan agar Atasan Divisi dapat memfilter pengajuan dari anggotanya
                $pinjaman = PinjamanKaryawan::create([
                    'karyawan_id' => $karyawan->id,
                    'jenis_kasbon' => $request->jenis_kasbon,
                    'departemen_id' => $karyawan->departemen_id,
                    'total_pinjaman' => $request->total_pinjaman,
                    'tenor_bulan' => $tenor,
                    'sisa_pinjaman' => $request->total_pinjaman,
                    'alasan_pinjaman' => $request->alasan_pinjaman,
                    'status' => 'Pending',
                ]);

                AuditTrail::create([
                    'user_id' => $request->user()->id,
                    'modul' => 'Kasbon',
                    'aksi' => "Pengajuan kasbon #{$pinjaman->id} (Rp " . number_format($pinjaman->total_pinjaman, 0, ',', '.') . ", {$tenor} bulan)",
                    'data_lama' => null,
                    'data_baru' => json_encode(['status' => 'Pending', 'total_pinjaman' => $pinjaman->total_pinjaman, 'tenor_bulan' => $tenor]),
                    'waktu' => now(),
                ]);

                return $pinjaman;
            });
        } catch (\DomainException $e) {
            return back()->withErrors(['total_pinjaman' => $e->getMessage()])->withInput();
        }

        $this->notifikasiWa($karyawan, "Pengajuan kasbon #{$pinjaman->id} sebesar Rp " . number_format($pinjaman->total_pinjaman, 0, ',', '.') . ' berhasil dikirim dan menunggu persetujuan.');

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
        $targetStatus = $request->status;

        try {
            $pinjamanFinal = DB::transaction(function () use ($user, $id, $targetStatus) {
                $pinjaman = PinjamanKaryawan::with('karyawan')->lockForUpdate()->findOrFail($id);
                $statusLama = $pinjaman->status;
                $role = (int) $user->role_id;

                // Pembatalan kasbon yang sudah Berjalan: hanya Admin/Finance, hanya ke Ditolak
                $pembatalan = $statusLama === 'Berjalan';
                if ($pembatalan) {
                    if (!in_array($role, [1, 4]) || $targetStatus !== 'Ditolak') {
                        throw new \DomainException('Kasbon yang sudah berjalan hanya dapat dibatalkan (ditolak) oleh Finance/Admin.');
                    }
                } elseif (!in_array($statusLama, ['Pending', 'Disetujui Atasan'])) {
                    // Whitelist transisi: hanya Pending / Disetujui Atasan yang boleh diproses
                    throw new \DomainException("Pengajuan berstatus {$statusLama} tidak dapat diproses lagi.");
                }

                if ($role === 5) {
                    // SPV: hanya status Pending, hanya departemennya, bukan milik sendiri
                    if ($statusLama !== 'Pending') {
                        throw new \DomainException('Pengajuan ini sudah diproses oleh atasan.');
                    }
                    $karyawanSpv = $user->karyawan;
                    if (!$karyawanSpv || $karyawanSpv->departemen_id !== $pinjaman->departemen_id) {
                        throw new \DomainException('Anda hanya dapat memproses pengajuan dari departemen Anda.');
                    }
                    if ($pinjaman->karyawan_id === $karyawanSpv->id) {
                        throw new \DomainException('Anda tidak dapat memproses pengajuan kasbon milik sendiri.');
                    }
                    if ($targetStatus === 'Ditolak') {
                        $pinjaman->status = 'Ditolak';
                    } else {
                        // Kasbon Divisi langsung berjalan, kasbon Finance menunggu persetujuan Finance
                        $pinjaman->status = $pinjaman->jenis_kasbon === 'Divisi' ? 'Berjalan' : 'Disetujui Atasan';
                    }
                    $pinjaman->approved_atasan_at = Carbon::now();
                } elseif (in_array($role, [1, 4])) {
                    if ($targetStatus === 'Ditolak') {
                        $pinjaman->status = 'Ditolak';
                    } elseif ($targetStatus === 'Disetujui Atasan') {
                        throw new \DomainException('Persetujuan atasan hanya dapat dilakukan oleh atasan divisi.');
                    } else {
                        // Berjalan: kasbon Finance wajib lebih dulu disetujui atasan
                        if ($pinjaman->jenis_kasbon === 'Finance' && $statusLama !== 'Disetujui Atasan') {
                            throw new \DomainException('Kasbon Finance harus disetujui atasan terlebih dahulu.');
                        }
                        $pinjaman->status = 'Berjalan';
                    }
                } else {
                    throw new \DomainException('Anda tidak berwenang memproses pengajuan ini.');
                }

                // Cek ulang limit saat kasbon akan berjalan (gaji/kasbon lain bisa berubah sejak pengajuan)
                if ($pinjaman->status === 'Berjalan') {
                    $hasil = $this->limit->evaluasi($pinjaman->karyawan_id, (float) $pinjaman->total_pinjaman, (int) $pinjaman->tenor_bulan, $pinjaman->id, $pinjaman->jenis_kasbon);
                    if (!$hasil['layak']) {
                        throw new \DomainException('Tidak dapat disetujui: ' . implode(' ', $hasil['alasan']));
                    }
                }

                $cicilanDihapus = 0;
                if ($pembatalan) {
                    $cicilanDihapus = $this->batalkanCicilanBelumDibayar($pinjaman);
                }

                $pinjaman->save();

                // Generate jadwal angsuran saat status menjadi 'Berjalan'
                if ($pinjaman->status === 'Berjalan' && $pinjaman->cicilans()->count() === 0) {
                    $tenor = (int) $pinjaman->tenor_bulan;
                    $total = (float) $pinjaman->total_pinjaman;
                    $nominalCicilan = round($total / $tenor, 0);
                    $awal = Carbon::now()->startOfMonth();
                    $terbayar = 0;

                    for ($i = 0; $i < $tenor; $i++) {
                        // Cicilan terakhir menampung selisih pembulatan
                        $nominal = ($i === $tenor - 1) ? $total - $terbayar : $nominalCicilan;
                        $terbayar += $nominal;

                        CicilanPinjaman::create([
                            'pinjaman_id' => $pinjaman->id,
                            'nominal_cicilan' => $nominal,
                            'jatuh_tempo' => $awal->copy()->addMonths($i + 1)->day(25),
                            'status_bayar' => 'Belum Lunas',
                            'metode_pelunasan' => 'Potong Gaji'
                        ]);
                    }
                }

                AuditTrail::create([
                    'user_id' => $user->id,
                    'modul' => 'Kasbon',
                    'aksi' => "Ubah status kasbon #{$pinjaman->id}: {$statusLama} -> {$pinjaman->status}" . ($pembatalan ? " (membatalkan {$cicilanDihapus} cicilan belum dibayar)" : ''),
                    'data_lama' => json_encode(['status' => $statusLama]),
                    'data_baru' => json_encode(['status' => $pinjaman->status]),
                    'waktu' => now(),
                ]);

                return $pinjaman;
            });

            $this->notifikasiWa($pinjamanFinal->karyawan, "Status pengajuan kasbon #{$pinjamanFinal->id} Anda kini: {$pinjamanFinal->status}.");
        } catch (\DomainException $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        } catch (\Throwable $e) {
            Log::error('Gagal memproses kasbon: ' . $e->getMessage(), ['pinjaman_id' => $id]);
            return back()->withErrors(['error' => 'Terjadi kesalahan saat memproses pengajuan kasbon.']);
        }

        return redirect()->back()->with('success', 'Status pengajuan kasbon berhasil diperbarui.');
    }

    public function uploadBuktiBayar(Request $request, $cicilanId)
    {
        $request->validate([
            'bukti_transfer' => 'required|image|mimes:jpeg,png,jpg|max:2048'
        ]);

        $user = $request->user();
        $cicilan = CicilanPinjaman::with('pinjaman')->findOrFail($cicilanId);
        $isStaff = in_array((int) $user->role_id, [1, 4]);

        // Non-admin/finance hanya boleh mengunggah untuk cicilan miliknya
        if (!$isStaff && (!$user->karyawan || $cicilan->pinjaman->karyawan_id !== $user->karyawan->id)) {
            abort(403, 'Cicilan ini bukan milik Anda.');
        }

        if ($cicilan->status_bayar !== 'Belum Lunas') {
            return back()->withErrors(['error' => 'Cicilan ini tidak dalam status Belum Lunas.']);
        }

        $path = $request->file('bukti_transfer')->store('bukti_kasbon', 'public');

        try {
            DB::transaction(function () use ($cicilan, $path, $isStaff, $user) {
                $cicilan->update([
                    'status_bayar' => $isStaff ? 'Lunas' : 'Menunggu Validasi',
                    'metode_pelunasan' => 'Tunai / Transfer',
                    'bukti_transfer' => $path,
                    'tgl_bayar' => Carbon::now()
                ]);

                // Finance/Admin yang mengunggah = pembayaran langsung tervalidasi
                if ($isStaff) {
                    $this->kurangiSisaPinjaman($cicilan);
                    AuditTrail::create([
                        'user_id' => $user->id,
                        'modul' => 'Kasbon',
                        'aksi' => "Pelunasan manual cicilan #{$cicilan->id}",
                        'data_lama' => null,
                        'data_baru' => json_encode(['status_bayar' => 'Lunas']),
                        'waktu' => now(),
                    ]);
                }
            });
        } catch (\Throwable $e) {
            Log::error('Gagal upload bukti bayar kasbon: ' . $e->getMessage(), ['cicilan_id' => $cicilanId]);
            return back()->withErrors(['error' => 'Terjadi kesalahan saat menyimpan bukti pembayaran.']);
        }

        return redirect()->back()->with('success', $isStaff
            ? 'Pembayaran angsuran berhasil dicatat.'
            : 'Bukti pembayaran berhasil diunggah dan menunggu verifikasi.');
    }

    public function verifikasiPelunasan(Request $request, $cicilanId)
    {
        $request->validate([
            'status_verifikasi' => 'required|in:Lunas,Ditolak'
        ]);

        try {
            DB::transaction(function () use ($request, $cicilanId) {
                $cicilan = CicilanPinjaman::with('pinjaman')->lockForUpdate()->findOrFail($cicilanId);

                if ($cicilan->status_bayar !== 'Menunggu Validasi') {
                    throw new \DomainException('Cicilan ini tidak sedang menunggu validasi.');
                }

                if ($request->status_verifikasi === 'Lunas') {
                    $cicilan->update(['status_bayar' => 'Lunas']);
                    $this->kurangiSisaPinjaman($cicilan);
                } else {
                    // Carry-over: kembali ke antrean potong gaji tanpa tautan payroll,
                    // sehingga ikut terpotong di payroll periode berikutnya (jatuh_tempo <= akhir periode)
                    $cicilan->update([
                        'status_bayar' => 'Belum Lunas',
                        'metode_pelunasan' => 'Potong Gaji',
                        'bukti_transfer' => null,
                        'tgl_bayar' => null,
                        'payroll_id' => null,
                    ]);
                }

                AuditTrail::create([
                    'user_id' => $request->user()->id,
                    'modul' => 'Kasbon',
                    'aksi' => "Verifikasi cicilan #{$cicilan->id}: {$request->status_verifikasi}",
                    'data_lama' => json_encode(['status_bayar' => 'Menunggu Validasi']),
                    'data_baru' => json_encode(['status_bayar' => $cicilan->status_bayar]),
                    'waktu' => now(),
                ]);
            });
        } catch (\DomainException $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        } catch (\Throwable $e) {
            Log::error('Gagal verifikasi pelunasan kasbon: ' . $e->getMessage(), ['cicilan_id' => $cicilanId]);
            return back()->withErrors(['error' => 'Terjadi kesalahan saat verifikasi pembayaran.']);
        }

        return redirect()->back()->with('success', 'Verifikasi pembayaran berhasil diproses.');
    }

    /** Hapus cicilan yang belum dibayar saat kasbon Berjalan dibatalkan; kembalikan jumlah yang dihapus. */
    private function batalkanCicilanBelumDibayar(PinjamanKaryawan $pinjaman): int
    {
        $cicilans = $pinjaman->cicilans()->lockForUpdate()->get();

        if ($cicilans->contains('status_bayar', 'Menunggu Validasi')) {
            throw new \DomainException('Masih ada cicilan menunggu validasi. Verifikasi terlebih dahulu sebelum membatalkan kasbon.');
        }

        $belumLunas = $cicilans->where('status_bayar', 'Belum Lunas');
        $idPayroll = $belumLunas->pluck('payroll_id')->filter()->unique();
        if ($idPayroll->isNotEmpty() && \App\Models\Payroll::whereIn('id', $idPayroll)->where('status', 'Draft')->exists()) {
            throw new \DomainException('Ada cicilan yang sudah masuk payroll Draft. Generate ulang payroll periode tersebut setelah kasbon dibatalkan, atau hapus Draft terlebih dahulu.');
        }

        CicilanPinjaman::whereIn('id', $belumLunas->pluck('id'))->delete();

        return $belumLunas->count();
    }

    private function kurangiSisaPinjaman(CicilanPinjaman $cicilan): void
    {
        $pinjaman = $cicilan->pinjaman;
        $sisaBaru = max(0, $pinjaman->sisa_pinjaman - $cicilan->nominal_cicilan);
        $pinjaman->update([
            'sisa_pinjaman' => $sisaBaru,
            'status' => $sisaBaru <= 0 ? 'Lunas' : 'Berjalan'
        ]);
    }
}
