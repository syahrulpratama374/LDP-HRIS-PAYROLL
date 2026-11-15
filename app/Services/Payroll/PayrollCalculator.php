<?php

namespace App\Services\Payroll;

use App\Models\Absensi;
use App\Models\CicilanPinjaman;
use App\Models\DetailPayroll;
use App\Models\HariLibur;
use App\Models\Karyawan;
use App\Models\KomponenPayrollKaryawan;
use App\Models\MasterKomponenPayroll;
use App\Models\Payroll;
use App\Models\PengajuanLembur;
use App\Models\PengajuanSpj;
use App\Models\PenilaianKinerja;
use App\Models\Pengaturan;
use App\Models\RiwayatGaji;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Orkestrasi perhitungan payroll satu periode. Semua data dimuat sekali per periode (bukan per karyawan).
 * Hanya menulis payroll berstatus Draft dan menautkan cicilan/SPJ ke payroll tersebut;
 * perubahan status cicilan/SPJ baru terjadi saat finalisasi (lihat PayrollFinalizer) sehingga generate idempoten.
 */
class PayrollCalculator
{
    public function __construct(
        private Pph21TerCalculator $pph,
        private BpjsCalculator $bpjs,
        private LemburCalculator $lembur,
    ) {}

    /** @return array{diproses: int, dilewati: int, peringatan: string[]} */
    public function generate(int $bulan, int $tahun): array
    {
        $awal = Carbon::create($tahun, $bulan, 1)->startOfDay();
        $akhir = $awal->copy()->endOfMonth();
        $cfg = $this->muatPengaturan();
        $metodeLembur = Pengaturan::teks('lembur_metode', 'flat');

        return DB::transaction(function () use ($bulan, $tahun, $awal, $akhir, $cfg, $metodeLembur) {
            $karyawans = Karyawan::with(['jabatan', 'golongan', 'ptkp'])
                ->where('status_aktif', true)
                ->where(fn ($q) => $q->whereNull('tgl_bergabung')->orWhere('tgl_bergabung', '<=', $akhir->toDateString()))
                ->get();
            $ids = $karyawans->pluck('id');

            // Payroll yang sudah final tidak disentuh; Draft dilepas dulu dari cicilan/SPJ agar bisa dihitung ulang
            $payrollAda = Payroll::where('periode_bulan', $bulan)->where('periode_tahun', $tahun)
                ->whereIn('karyawan_id', $ids)->get()->keyBy('karyawan_id');
            $idDraft = $payrollAda->where('status', 'Draft')->pluck('id');
            CicilanPinjaman::whereIn('payroll_id', $idDraft)->where('status_bayar', 'Belum Lunas')->update(['payroll_id' => null]);
            PengajuanSpj::whereIn('payroll_id', $idDraft)->update(['payroll_id' => null]);
            DetailPayroll::whereIn('payroll_id', $idDraft)->delete();

            // ---- Muat data periode sekali ----
            $riwayatGaji = RiwayatGaji::whereIn('karyawan_id', $ids)
                ->where('effective_date_start', '<=', $akhir->toDateString())
                ->where(fn ($q) => $q->whereNull('effective_date_end')->orWhere('effective_date_end', '>=', $akhir->toDateString()))
                ->orderBy('effective_date_start')->get()->groupBy('karyawan_id');

            $lemburs = PengajuanLembur::whereIn('karyawan_id', $ids)->where('status_approval', 'Disetujui')
                ->whereBetween('tanggal', [$awal->toDateString(), $akhir->toDateString()])->get()->groupBy('karyawan_id');
            $hariLibur = HariLibur::whereBetween('tanggal', [$awal->toDateString(), $akhir->toDateString()])
                ->pluck('tanggal')->mapWithKeys(fn ($t) => [Carbon::parse($t)->toDateString() => true])->all();

            $spjs = PengajuanSpj::whereIn('karyawan_id', $ids)->where('status_approval', 'Selesai')
                ->where('sudah_dibayar', false)->whereNull('payroll_id')
                ->where('tgl_selesai', '<=', $akhir->toDateString())->get()->groupBy('karyawan_id');

            $kpis = PenilaianKinerja::whereIn('karyawan_id', $ids)->where('periode_bulan', $bulan)
                ->where('periode_tahun', $tahun)->get()->keyBy('karyawan_id');

            $absensi = Absensi::whereIn('karyawan_id', $ids)->whereIn('status', ['Alpha', 'Terlambat'])
                ->whereBetween('tanggal', [$awal->toDateString(), $akhir->toDateString()])
                ->select('karyawan_id', 'status', DB::raw('count(*) as jml'))->groupBy('karyawan_id', 'status')->get()
                ->groupBy('karyawan_id');

            $cicilans = CicilanPinjaman::with('pinjaman')
                ->where('status_bayar', 'Belum Lunas')->where('metode_pelunasan', 'Potong Gaji')->whereNull('payroll_id')
                ->where('jatuh_tempo', '<=', $akhir->toDateString())
                ->whereHas('pinjaman', fn ($q) => $q->whereIn('karyawan_id', $ids)->where('status', 'Berjalan'))
                ->orderBy('jatuh_tempo')->get()->groupBy(fn ($c) => $c->pinjaman->karyawan_id);

            $komponenKaryawan = KomponenPayrollKaryawan::with('komponen')->whereIn('karyawan_id', $ids)
                ->get()->groupBy('karyawan_id');
            $idKomponen = MasterKomponenPayroll::pluck('id', 'kode_komponen');

            // Rekonsiliasi Desember: total Jan–Nov per karyawan
            $sebelumnya = $bulan === 12
                ? Payroll::whereIn('karyawan_id', $ids)->where('periode_tahun', $tahun)->where('periode_bulan', '<', 12)
                    ->select('karyawan_id', DB::raw('sum(bruto_pajak) bruto'), DB::raw('sum(iuran_pensiun) iuran'), DB::raw('sum(pph21) pph'))
                    ->groupBy('karyawan_id')->get()->keyBy('karyawan_id')
                : collect();

            $diproses = 0;
            $dilewati = 0;
            $peringatan = [];

            foreach ($karyawans as $k) {
                $payroll = $payrollAda[$k->id] ?? new Payroll([
                    'karyawan_id' => $k->id, 'periode_bulan' => $bulan, 'periode_tahun' => $tahun, 'status' => 'Draft',
                ]);
                if ($payroll->exists && $payroll->status !== 'Draft') {
                    $dilewati++;
                    continue;
                }
                $payroll->save();

                $baris = [];
                $tambah = function (string $nama, string $jenis, float $nominal, ?string $kode = null) use (&$baris, $idKomponen) {
                    $baris[] = [
                        'komponen_id' => $kode ? ($idKomponen[$kode] ?? null) : null,
                        'nama_komponen_snapshot' => $nama, 'jenis' => $jenis, 'nominal' => round($nominal, 2),
                    ];
                };

                // ---- Pemasukan tetap (prorata untuk karyawan masuk tengah bulan) ----
                $gajiPenuh = (float) (($riwayatGaji[$k->id] ?? collect())->last()->nominal_gaji_pokok ?? $k->golongan->gaji_pokok ?? 0);
                $tunjanganPenuh = (float) ($k->jabatan->tunjangan ?? 0);
                $faktor = $this->faktorProrata($k->tgl_bergabung, $awal);
                $gajiPokok = round($gajiPenuh * $faktor);
                $tunjanganJabatan = round($tunjanganPenuh * $faktor);

                $pemasukan = $gajiPokok + $tunjanganJabatan;
                $brutoPajak = $gajiPokok + $tunjanganJabatan;
                $label = $faktor < 1 ? ' (prorata ' . round($faktor * 100) . '%)' : '';

                $tambah('Gaji Pokok' . $label, 'Pemasukan', $gajiPokok, 'GP');
                if ($tunjanganJabatan > 0) {
                    $tambah('Tunjangan Jabatan' . $label, 'Pemasukan', $tunjanganJabatan, 'TJ');
                }

                $potonganKomponen = 0.0;
                $upahTetap = $gajiPokok + $tunjanganJabatan;
                foreach ($komponenKaryawan[$k->id] ?? [] as $kk) {
                    $nominal = round((float) $kk->nominal * $faktor);
                    if ($kk->komponen->jenis === 'Pemasukan') {
                        $pemasukan += $nominal;
                        if ($kk->komponen->is_taxable) {
                            $brutoPajak += $nominal;
                        }
                        $tambah($kk->komponen->nama_komponen, 'Pemasukan', $nominal);
                        $baris[array_key_last($baris)]['komponen_id'] = $kk->komponen_id;
                    } else {
                        $potonganKomponen += $nominal;
                        $tambah($kk->komponen->nama_komponen, 'Potongan', $nominal);
                        $baris[array_key_last($baris)]['komponen_id'] = $kk->komponen_id;
                    }
                }

                // ---- Pemasukan variabel ----
                $hasilLembur = $this->lembur->hitung($lemburs[$k->id] ?? collect(), $upahTetap, $metodeLembur, $cfg['tarif_lembur_per_jam'], $hariLibur);
                if ($hasilLembur['total'] > 0) {
                    $pemasukan += $hasilLembur['total'];
                    $brutoPajak += $hasilLembur['total'];
                    $tambah('Uang Lembur (' . rtrim(rtrim(number_format($hasilLembur['jam'], 2, ',', ''), '0'), ',') . ' jam)', 'Pemasukan', $hasilLembur['total'], 'LBR');
                }

                $spjKaryawan = $spjs[$k->id] ?? collect();
                $totalSpj = (float) $spjKaryawan->sum('total_biaya');
                if ($totalSpj > 0) {
                    $pemasukan += $totalSpj; // reimbursement: tidak masuk bruto pajak
                    $tambah('Pencairan SPJ', 'Pemasukan', $totalSpj, 'SPJ');
                    PengajuanSpj::whereIn('id', $spjKaryawan->pluck('id'))->update(['payroll_id' => $payroll->id]);
                }

                $kpi = $kpis[$k->id] ?? null;
                if ($kpi && $kpi->skor_kpi >= $cfg['kpi_ambang_bonus']) {
                    $bonus = round($gajiPokok * $cfg['kpi_bonus_persen'] / 100);
                    $pemasukan += $bonus;
                    $brutoPajak += $bonus;
                    $tambah('Bonus Kinerja (Skor: ' . $kpi->skor_kpi . ')', 'Pemasukan', $bonus, 'BONUS-KPI');
                }

                // ---- Potongan ----
                $potongan = $potonganKomponen;

                $absenKaryawan = $absensi[$k->id] ?? collect();
                $jmlAlpha = (int) ($absenKaryawan->firstWhere('status', 'Alpha')->jml ?? 0);
                $jmlTelat = (int) ($absenKaryawan->firstWhere('status', 'Terlambat')->jml ?? 0);
                $potonganAbsen = round($jmlAlpha * ($gajiPenuh / max(1, $cfg['hari_kerja_sebulan'])) + $jmlTelat * $cfg['denda_terlambat']);
                if ($potonganAbsen > 0) {
                    $potongan += $potonganAbsen;
                    $tambah("Potongan Absensi ($jmlAlpha Alpha, $jmlTelat Telat)", 'Potongan', $potonganAbsen, 'POT-ABSEN');
                }

                $cicilanKaryawan = $cicilans[$k->id] ?? collect();
                $totalCicilan = (float) $cicilanKaryawan->sum('nominal_cicilan');
                if ($totalCicilan > 0) {
                    $potongan += $totalCicilan;
                    $tambah('Cicilan Kasbon', 'Potongan', $totalCicilan, 'KASBON');
                    CicilanPinjaman::whereIn('id', $cicilanKaryawan->pluck('id'))->update(['payroll_id' => $payroll->id]);
                }

                $iuran = $this->bpjs->hitung($upahTetap, $cfg);
                $brutoPajak += $iuran['premi_bruto'];
                $potongan += $iuran['total_karyawan'];
                $tambah('Iuran BPJS JHT (' . $this->angka($cfg['bpjs_jht_karyawan']) . '%)', 'Potongan', $iuran['jht'], 'BPJS-JHT');
                $tambah('Iuran BPJS JP (' . $this->angka($cfg['bpjs_jp_karyawan']) . '%)', 'Potongan', $iuran['jp'], 'BPJS-JP');
                $tambah('Iuran BPJS Kesehatan (' . $this->angka($cfg['bpjs_kes_karyawan']) . '%)', 'Potongan', $iuran['kes'], 'BPJS-KS');

                // ---- PPh 21 ----
                $kategori = $this->pph->kategori($k->ptkp->kategori_ter ?? null, $k->ptkp->kode_ptkp ?? null);
                $warn = null;
                if ($bulan === 12) {
                    $lalu = $sebelumnya[$k->id] ?? null;
                    $hasil = $this->pph->hitungDesember(
                        $kategori,
                        $brutoPajak + (float) ($lalu->bruto ?? 0),
                        $iuran['iuran_pensiun'] + (float) ($lalu->iuran ?? 0),
                        (float) ($k->ptkp->nominal_neto_tahunan ?? 54_000_000),
                        (float) ($lalu->pph ?? 0),
                        $cfg['biaya_jabatan_persen'],
                        $cfg['biaya_jabatan_maks_tahunan'],
                    );
                    $warn = $hasil['peringatan'];
                } else {
                    $hasil = $this->pph->hitungBulanan($kategori, $brutoPajak);
                }
                if ($hasil['pph'] > 0) {
                    $potongan += $hasil['pph'];
                    $tambah('PPh 21 (' . $hasil['rincian']['metode'] . ')', 'Potongan', $hasil['pph'], 'PPH21');
                }

                // ---- Ringkasan ----
                $bersih = $pemasukan - $potongan;
                if ($bersih < 0) {
                    $warn = trim(($warn ? $warn . ' ' : '') . 'Gaji bersih negatif; periksa potongan.');
                }
                if ($warn) {
                    $peringatan[] = "{$k->nama_lengkap}: {$warn}";
                }

                $payroll->update([
                    'gaji_pokok_saat_itu' => $gajiPokok,
                    'total_pemasukan' => $pemasukan,
                    'total_potongan' => $potongan,
                    'total_gaji_bersih' => $bersih,
                    'bruto_pajak' => $brutoPajak,
                    'iuran_pensiun' => $iuran['iuran_pensiun'],
                    'pph21' => $hasil['pph'],
                    'bpjs_perusahaan' => $iuran['total_perusahaan'],
                    'peringatan' => $warn,
                    'rincian_pajak' => $hasil['rincian'],
                ]);

                $now = now();
                DetailPayroll::insert(array_map(fn ($b) => $b + [
                    'payroll_id' => $payroll->id, 'created_at' => $now, 'updated_at' => $now,
                ], $baris));
                $diproses++;
            }

            return ['diproses' => $diproses, 'dilewati' => $dilewati, 'peringatan' => $peringatan];
        });
    }

    /** Porsi hari kerja bagi karyawan yang bergabung di tengah bulan periode ini (hari kalender). */
    private function faktorProrata($tglBergabung, Carbon $awalBulan): float
    {
        if (!$tglBergabung) {
            return 1.0;
        }
        $masuk = Carbon::parse($tglBergabung)->startOfDay();
        if ($masuk->lte($awalBulan)) {
            return 1.0;
        }
        $hariBulan = $awalBulan->daysInMonth;

        return ($hariBulan - $masuk->day + 1) / $hariBulan;
    }

    private function angka(float $n): string
    {
        return rtrim(rtrim(number_format($n, 2, ',', ''), '0'), ',');
    }

    /** Nilai Pengaturan numerik dengan default aman bila belum di-seed. */
    private function muatPengaturan(): array
    {
        $default = [
            'denda_terlambat' => 50000, 'tarif_lembur_per_jam' => 25000, 'hari_kerja_sebulan' => 22,
            'kpi_ambang_bonus' => 90, 'kpi_bonus_persen' => 10,
            'bpjs_jht_karyawan' => 2, 'bpjs_jp_karyawan' => 1, 'bpjs_kes_karyawan' => 1,
            'bpjs_jht_perusahaan' => 3.7, 'bpjs_jp_perusahaan' => 2, 'bpjs_kes_perusahaan' => 4,
            'bpjs_jkk_perusahaan' => 0.24, 'bpjs_jkm_perusahaan' => 0.3,
            'bpjs_batas_upah_jp' => 10547400, 'bpjs_batas_upah_kes' => 12000000,
            'biaya_jabatan_persen' => 5, 'biaya_jabatan_maks_tahunan' => 6000000,
        ];
        $tersimpan = Pengaturan::whereIn('kunci', array_keys($default))->pluck('nilai', 'kunci');

        $cfg = [];
        foreach ($default as $kunci => $nilai) {
            $cfg[$kunci] = is_numeric($tersimpan[$kunci] ?? null) ? (float) $tersimpan[$kunci] : (float) $nilai;
        }

        return $cfg;
    }
}
