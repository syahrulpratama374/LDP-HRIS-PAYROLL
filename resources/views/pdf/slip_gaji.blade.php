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
        <p class="subtitle">Slip Gaji Periode: {{ $payroll->periode_bulan }} {{ $payroll->periode_tahun }}</p>
    </div>

    <table class="info-table">
        <tr>
            <td width="15%"><strong>Nama</strong></td>
            <td width="35%">: {{ $payroll->karyawan->nama_lengkap }}</td>
            <td width="15%"><strong>Jabatan</strong></td>
            <td width="35%">: {{ $payroll->karyawan->jabatan->nama_jabatan }}</td>
        </tr>
        <tr>
            <td><strong>NIK</strong></td>
            <td>: {{ $payroll->karyawan->nik_internal }}</td>
            <td><strong>Departemen</strong></td>
            <td>: {{ $payroll->karyawan->departemen->nama_departemen }}</td>
        </tr>
    </table>

    <table class="data-table">
        <thead>
            <tr>
                <th width="70%">Keterangan Komponen</th>
                <th width="30%" class="text-right">Nominal (Rp)</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td><strong>Gaji Pokok</strong></td>
                <td class="text-right">{{ number_format($payroll->gaji_pokok, 0, ',', '.') }}</td>
            </tr>
            <!-- Looping Detail Tunjangan/Potongan -->
            @foreach($payroll->detailPayrolls as $detail)
            <tr>
                <td>{{ $detail->nama_komponen }} ({{ $detail->jenis_komponen }})</td>
                <td class="text-right">{{ number_format($detail->nominal, 0, ',', '.') }}</td>
            </tr>
            @endforeach
            <tr class="total-row">
                <td><strong>TOTAL GAJI BERSIH (TAKE HOME PAY)</strong></td>
                <td class="text-right"><strong>{{ number_format($payroll->total_thp, 0, ',', '.') }}</strong></td>
            </tr>
        </tbody>
    </table>

    <div class="footer">
        <div class="signature-box">
            <p>Finance & Accounting</p>
            <div class="signature-line">(................................)</div>
        </div>
    </div>
</body>
</html>