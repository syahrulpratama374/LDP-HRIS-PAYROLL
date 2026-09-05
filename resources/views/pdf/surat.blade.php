<!DOCTYPE html>
<html>
<head>
    <title>Surat {{ $surat->nomor_surat }}</title>
    <style>
        body { font-family: 'Helvetica', 'Arial', sans-serif; font-size: 12pt; line-height: 1.5; margin: 30px; }
        .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
        .header h1 { margin: 0; font-size: 18pt; letter-spacing: 1px; }
        .header p { margin: 0; font-size: 10pt; color: #333; }
        .content { text-align: justify; margin-bottom: 40px; }
        .signature { width: 100%; margin-top: 50px; }
        .signature td { width: 50%; text-align: center; }
    </style>
</head>
<body>
    <!-- Kop Surat -->
    <div class="header">
        <h1>PT. LDP JOGJA</h1>
        <p>Jl. Contoh Alamat No. 123, Yogyakarta | Telp: (0274) 123456 | Email: hris@ldp.co.id</p>
    </div>

    <!-- Judul & Nomor Surat -->
    <div style="text-align: center; margin-bottom: 30px;">
        <h3 style="margin: 0; text-decoration: underline; text-transform: uppercase;">{{ $surat->template->nama_template }}</h3>
        <p style="margin: 0;">Nomor: {{ $surat->nomor_surat }}</p>
    </div>

    <!-- Isi Surat Dinamis dari Template -->
    <div class="content">
        {!! $konten !!}
    </div>

    <!-- Tanda Tangan -->
    <table class="signature">
        <tr>
            <td></td>
            <td>
                <p>Yogyakarta, {{ \Carbon\Carbon::parse($surat->tanggal_terbit)->translatedFormat('d F Y') }}</p>
                <br><br><br><br>
                <p><strong><u>Human Capital Dept.</u></strong></p>
            </td>
        </tr>
    </table>
</body>
</html>