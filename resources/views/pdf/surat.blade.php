<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Surat Resmi - PT. Lintas Data Prima</title>
    <style>
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
            padding: 5px 10px; 
            width: 50%;
        }
        .label-ttd { 
            font-weight: bold; 
            font-size: 9.5pt; 
            text-transform: capitalize; 
            margin-bottom: 6px; 
        }
        .qr-box { 
            margin: 4px auto; 
            min-height: 75px;
            text-align: center;
        }
        .img-ttd-canvas {
            max-height: 60px;
            max-width: 150px;
        }
        .badge-method {
            font-size: 7pt;
            color: #1e40af;
            background-color: #eff6ff;
            border: 1px solid #bfdbfe;
            padding: 2px 6px;
            border-radius: 4px;
            margin-top: 3px;
            font-weight: bold;
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

    <!-- PENERIMA -->
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
                @if($appr->status === 'Disetujui')
                    {{-- CEK APAKAH ADA FILE GAMBAR TTD DI STORAGE --}}
                    @php
                        $fullPath = $appr->ttd_image_path ? storage_path('app/public/' . $appr->ttd_image_path) : null;
                    @endphp

                    @if($appr->jenis_ttd === 'canvas' && $fullPath && file_exists($fullPath))
                        @php
                            $imageData = base64_encode(file_get_contents($fullPath));
                            $src = 'data:image/png;base64,' . $imageData;
                        @endphp
                        <img src="{{ $src }}" class="img-ttd-canvas"><br>
                        <span class="badge-method">✓ TTD Digital Canvas</span>
                    @else
                        {{-- FALLBACK KE QR CODE --}}
                        @if($surat->qr_code_token)
                            <img src="data:image/svg+xml;base64,{!! base64_encode(SimpleSoftwareIO\QrCode\Facades\QrCode::format('svg')->size(60)->generate(url('/persuratan/verifikasi/' . $surat->qr_code_token))) !!}"><br>
                            <span class="badge-method">⚡ Enkripsi QR Valid</span>
                        @endif
                    @endif
                @else
                    <div style="height: 60px; line-height: 60px; color: #aaa; font-style: italic; font-size: 8.5pt;">[ Menunggu TTD ]</div>
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
    </div>
    @endif

</body>
</html>