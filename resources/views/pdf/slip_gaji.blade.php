<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Slip Gaji - {{ $payroll->karyawan->nama_lengkap }}</title>
    <style>
        body { font-family: Arial, sans-serif; font-size: 12px; color: #333; }
        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
        .title { font-size: 18px; font-weight: bold; margin: 0; }
        .subtitle { font-size: 12px; margin: 5px 0 0; color: #666; }
        .info-table { width: 100%; margin-bottom: 20px; }
        .info-table td { padding: 4px 0; }
        .data-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .data-table th, .data-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .data-table th { background-color: #f4f4f4; }
        .text-right { text-align: right; }
        .total-row { font-weight: bold; background-color: #f9f9f9; }
        .footer { margin-top: 40px; text-align: center; width: 100%; }
        .signature-box { float: right; width: 200px; text-align: center; }
        .signature-line { margin-top: 60px; border-top: 1px solid #333; padding-top: 5px; }
    </style>
</head>
<body>
    <div class="header">
        <h1 class="title">PT LDP HRIS</h1>
        <p class="subtitle">Slip Gaji Periode: {{ ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'][$payroll->periode_bulan - 1] }} {{ $payroll->periode_tahun }}</p>
    </div>

    <table class="info-table">
        <tr>
            <td width="15%"><strong>Nama</strong></td>
            <td width="35%">: {{ $payroll->karyawan->nama_lengkap }}</td>
            <td width="15%"><strong>Jabatan</strong></td>
            <td width="35%">: {{ $payroll->karyawan->jabatan->nama_jabatan ?? '-' }}</td>
        </tr>
        <tr>
            <td><strong>NIK</strong></td>
            <td>: {{ $payroll->karyawan->nik_internal }}</td>
            <td><strong>Departemen</strong></td>
            <td>: {{ $payroll->karyawan->departemen->nama_departemen ?? '-' }}</td>
        </tr>
    </table>

    @php
        $namaBulan = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
        $pemasukan = $payroll->detailPayrolls->where('jenis', 'Pemasukan');
        $potongan = $payroll->detailPayrolls->where('jenis', 'Potongan');
        $rp = fn ($n) => number_format($n, 0, ',', '.');
        $rincian = $payroll->rincian_pajak;
    @endphp

    <table class="data-table">
        <thead>
            <tr>
                <th width="70%">Keterangan Komponen</th>
                <th width="30%" class="text-right">Nominal (Rp)</th>
            </tr>
        </thead>
        <tbody>
            <tr><td colspan="2"><strong>PEMASUKAN</strong></td></tr>
            @foreach($pemasukan as $detail)
            <tr>
                <td>{{ $detail->nama_komponen_snapshot }}</td>
                <td class="text-right">{{ $rp($detail->nominal) }}</td>
            </tr>
            @endforeach
            <tr class="total-row">
                <td>Total Pemasukan</td>
                <td class="text-right">{{ $rp($payroll->total_pemasukan) }}</td>
            </tr>
            <tr><td colspan="2"><strong>POTONGAN</strong></td></tr>
            @forelse($potongan as $detail)
            <tr>
                <td>{{ $detail->nama_komponen_snapshot }}</td>
                <td class="text-right">{{ $rp($detail->nominal) }}</td>
            </tr>
            @empty
            <tr><td colspan="2">- Tidak ada potongan -</td></tr>
            @endforelse
            <tr class="total-row">
                <td>Total Potongan</td>
                <td class="text-right">{{ $rp($payroll->total_potongan) }}</td>
            </tr>
            <tr class="total-row">
                <td><strong>TOTAL GAJI BERSIH (TAKE HOME PAY)</strong></td>
                <td class="text-right"><strong>{{ $rp($payroll->total_gaji_bersih) }}</strong></td>
            </tr>
        </tbody>
    </table>

    @if($rincian)
    <p><strong>Rincian PPh 21 — {{ $rincian['metode'] }} (Kategori {{ $rincian['kategori'] ?? '-' }})</strong></p>
    <table class="data-table">
        @if(isset($rincian['bruto_bulanan']))
        <tr><td width="70%">Penghasilan bruto bulan ini</td><td class="text-right">{{ $rp($rincian['bruto_bulanan']) }}</td></tr>
        <tr><td>Tarif efektif (TER)</td><td class="text-right">{{ $rincian['tarif'] }}%</td></tr>
        @else
        <tr><td width="70%">Bruto setahun</td><td class="text-right">{{ $rp($rincian['bruto_setahun']) }}</td></tr>
        <tr><td>Biaya jabatan</td><td class="text-right">{{ $rp($rincian['biaya_jabatan']) }}</td></tr>
        <tr><td>Iuran JHT + JP setahun</td><td class="text-right">{{ $rp($rincian['iuran_pensiun']) }}</td></tr>
        <tr><td>PTKP</td><td class="text-right">{{ $rp($rincian['ptkp']) }}</td></tr>
        <tr><td>PKP</td><td class="text-right">{{ $rp($rincian['pkp']) }}</td></tr>
        <tr><td>PPh 21 setahun (Pasal 17)</td><td class="text-right">{{ $rp($rincian['pph_setahun']) }}</td></tr>
        <tr><td>Dikurangi PPh Januari–November</td><td class="text-right">{{ $rp($rincian['pph_jan_nov']) }}</td></tr>
        @endif
        <tr class="total-row"><td>PPh 21 dipotong</td><td class="text-right">{{ $rp($payroll->pph21) }}</td></tr>
        <tr><td>Iuran BPJS porsi perusahaan (informasi)</td><td class="text-right">{{ $rp($payroll->bpjs_perusahaan) }}</td></tr>
    </table>
    @endif

    <div class="footer">
        <div class="signature-box">
            <p>Finance & Accounting</p>
            <div class="signature-line">(................................)</div>
        </div>
    </div>
</body>
</html>