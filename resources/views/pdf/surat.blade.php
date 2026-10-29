<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Surat Resmi - PT. Lintas Data Prima</title>
    <style>
        /* ✅ Atur Margin Kertas A4 (Atas, Kanan, Bawah, Kiri) */
        @page {
            margin: 1.5cm 2cm 2cm 2cm;
        }
        body { 
            font-family: 'Helvetica', 'Arial', sans-serif; 
            font-size: 11pt; 
            color: #333; 
            line-height: 1.5; 
        }
        .kop-surat { 
            border-bottom: 2px solid #000; 
            padding-bottom: 8px; 
            margin-bottom: 20px; 
        }
        .meta-surat { 
            width: 100%; 
            margin-bottom: 20px; 
            font-size: 10.5pt; 
            border-collapse: collapse; 
        }
        .meta-surat td { 
            vertical-align: top; 
            padding: 2px 0; 
        }
        .penerima-block { 
            margin-bottom: 20px; 
            font-size: 10.5pt; 
        }
        .isi-surat { 
            text-align: justify; 
            margin-bottom: 30px; 
            min-height: 150px; 
        }
        .tanggal-terbit { 
            text-align: right; 
            margin-bottom: 15px; 
            font-size: 10.5pt; 
        }
        .ttd-container { 
            width: 100%; 
            margin-top: 20px; 
            page-break-inside: avoid; 
        }
        .ttd-table { 
            width: 100%; 
            border-collapse: collapse; 
            text-align: center; 
        }
        .ttd-table td { 
            vertical-align: top; 
            padding: 5px; 
        }
        .label-ttd { 
            font-weight: bold; 
            font-size: 9.5pt; 
            text-transform: capitalize; 
            margin-bottom: 6px; 
        }
        .qr-box { 
            margin: 5px auto; 
        }
        .nama-ttd { 
            font-weight: bold; 
            font-size: 10pt; 
            text-decoration: underline; 
            margin-top: 4px; 
        }
        .jabatan-ttd { 
            font-size: 8.5pt; 
            color: #666; 
        }
        .lampiran-box { 
            margin-top: 30px; 
            border-top: 1px solid #ddd; 
            padding-top: 10px; 
            font-size: 8.5pt; 
            color: #555; 
            page-break-inside: avoid; 
        }
    </style>
</head>
<body>

    <!-- KOP SURAT -->
    <div class="kop-surat">
        <table width="100%" style="border-collapse: collapse;">
            <tr>
                <td width="20%" style="vertical-align: middle;">
                    <strong style="font-size: 26pt; color: #1e3a8a;">LDP</strong>
                </td>
                <td width="80%" align="center" style="vertical-align: middle;">
                    <h2 style="margin:0; font-size: 13pt; text-transform: uppercase;">PT. LINTAS DATA PRIMA</h2>
                    <p style="margin:2px 0 0 0; font-size: 8.5pt; color: #333;">Telecommunication & IT Managed Services</p>
                    <p style="margin:2px 0 0 0; font-size: 8pt; color: #555;">Jl. Sakti No. 12, Yogyakarta | Telp: (0274) 415632</p>
                </td>
            </tr>
        </table>
    </div>

    <!-- META SURAT -->
    <table class="meta-surat">
        <tr>
            <td width="15%">Nomor</td>
            <td width="2%">:</td>
            <td width="83%"><strong>{{ $surat->nomor_surat ?? 'Draft/Belum_Diterbitkan' }}</strong></td>
        </tr>
        <tr>
            <td>Lampiran</td>
            <td>:</td>
            <td>
                @if($surat->lampirans && $surat->lampirans->count() > 0)
                    {{ $surat->lampirans->count() }} Berkas
                @else
                    -
                @endif
            </td>
        </tr>
        <tr>
            <td>Hal</td>
            <td>:</td>
            <td><strong>{{ $surat->template->nama_template ?? 'Surat Resmi' }}</strong></td>
        </tr>
    </table>

    <!-- PENERIMA (TAMPILKAN JIKA DITUJUKAN KE KARYAWAN) -->
    @if($surat->karyawan)
    <div class="penerima-block">
        <p style="margin:0;">Kepada Yth,</p>
        <p style="margin:0; font-weight: bold;">{{ $surat->karyawan->nama_lengkap }}</p>
        <p style="margin:0; font-size: 9.5pt; color: #555;">{{ $surat->karyawan->jabatan->nama_jabatan ?? '' }}</p>
    </div>
    @endif

    <!-- ISI SURAT -->
    <div class="isi-surat">
        {!! $konten !!}
    </div>

    <!-- TANGGAL & BLOK TTD -->
    <div class="ttd-container">
        <div class="tanggal-terbit">
            Yogyakarta, {{ \Carbon\Carbon::parse($surat->tanggal_terbit ?? now())->translatedFormat('d F Y') }}
        </div>

        <table class="ttd-table">
            <tr>
                @foreach($surat->approvals as $appr)
                <td>
                    <div class="label-ttd">{{ str_replace('okeh', 'oleh', $appr->label_ttd) }}</div>
                    
                    <div class="qr-box">
                        @if($surat->status === 'Terbit' && $surat->qr_code_token)
                            <img src="data:image/svg+xml;base64,{!! base64_encode(SimpleSoftwareIO\QrCode\Facades\QrCode::format('svg')->size(70)->generate(url('/persuratan/verifikasi/' . $surat->qr_code_token))) !!}">
                        @else
                            <div style="height: 70px; line-height: 70px; color: #aaa; font-style: italic; font-size: 8.5pt;">[ Menunggu TTD ]</div>
                        @endif
                    </div>

                    <div class="nama-ttd">{{ $appr->userAktual->name ?? '........................' }}</div>
                    <div class="jabatan-ttd">{{ $appr->jabatan->nama_jabatan ?? '' }}</div>
                </td>
                @endforeach
            </tr>
        </table>
    </div>

    <!-- LAMPIRAN BERKAS -->
    @if($surat->lampirans && $surat->lampirans->count() > 0)
    <div class="lampiran-box">
        <strong>Lampiran Berkas Pendukung:</strong>
        <ol style="margin: 4px 0 0 0; padding-left: 18px;">
            @foreach($surat->lampirans as $lamp)
                <li>{{ $lamp->nama_file_asli }} ({{ round($lamp->file_size / 1024, 1) }} KB)</li>
            @endforeach
        </ol>
        <!-- PROYEKSI PREVIEW GAMBAR (JIKA ADA) -->
    <div style="margin-top: 15px;">
        @foreach($surat->lampirans as $lamp)
            @if(in_array(strtolower(pathinfo($lamp->nama_file_asli, PATHINFO_EXTENSION)), ['jpg', 'jpeg', 'png']))
                <div style="margin-bottom: 15px; text-align: center;">
                    <p style="font-size: 8pt; color: #666; margin-bottom: 4px;">[ Gambar Lampiran: {{ $lamp->nama_file_asli }} ]</p>
                    <img src="{{ public_path('storage/' . $lamp->file_path) }}" style="max-width: 80%; max-height: 400px; border: 1px solid #ccc; padding: 4px;">
                </div>
            @endif
        @endforeach
    </div>
    @endif

</body>
</html>