<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Surat Resmi - {{ $layout->nama_perusahaan ?? 'PT. Lintas Data Prima' }}</title>
    <style>
        @page {
            margin: 1.5cm 2cm 2.5cm 2cm;
        }
        body { 
            font-family: 'Helvetica', 'Arial', sans-serif; 
            font-size: 11pt; 
            color: #333; 
            line-height: 1.5; 
        }
        
        /* HEADER / KOP SURAT */
        .kop-surat { border-bottom: 3px solid #000; padding-bottom: 10px; margin-bottom: 20px; width: 100%; }
        .tabel-kop { width: 100%; border-collapse: collapse; }
        .logo-container { width: 25%; text-align: left; vertical-align: middle; }
        .logo-img { max-width: 120px; max-height: 80px; }
        .kop-teks { width: 75%; text-align: center; vertical-align: middle; }
        .nama-perusahaan { margin: 0; font-size: 16pt; font-weight: bold; text-transform: uppercase; color: #1e3a8a; }
        .slogan-perusahaan { margin: 2px 0; font-size: 9.5pt; font-weight: bold; }
        .kontak-perusahaan { margin: 0; font-size: 8.5pt; color: #444; }

        /* WATERMARK */
        .watermark { position: fixed; top: 35%; left: 50%; transform: translate(-50%, -50%); opacity: 0.1; z-index: -1000; text-align: center; }
        .watermark img { max-width: 450px; }

        /* BANNER FOOTER */
        .footer-banner { position: fixed; bottom: -1cm; left: 0; width: 100%; text-align: center; }
        .footer-img { width: 100%; max-height: 60px; object-fit: contain; }

        /* STRUKTUR KONTEN SURAT */
        .meta-surat { width: 100%; margin-bottom: 20px; font-size: 10.5pt; border-collapse: collapse; }
        .meta-surat td { vertical-align: top; padding: 2px 0; }
        .penerima-block { margin-bottom: 20px; font-size: 10.5pt; }
        .isi-surat { text-align: justify; margin-bottom: 30px; min-height: 150px; }
        
        /* TANDA TANGAN */
        .tanggal-terbit { text-align: right; margin-bottom: 15px; font-size: 10.5pt; }
        .ttd-container { width: 100%; margin-top: 20px; page-break-inside: avoid; }
        .ttd-table { width: 100%; border-collapse: collapse; text-align: center; }
        .ttd-table td { vertical-align: top; padding: 5px 10px; width: 50%; }
        .label-ttd { font-weight: bold; font-size: 9.5pt; text-transform: capitalize; margin-bottom: 6px; }
        .qr-box { margin: 4px auto; min-height: 75px; text-align: center; }
        .img-ttd-canvas { max-height: 60px; max-width: 150px; }
        .badge-method { font-size: 7.5pt; color: #1e40af; border: 1px solid #bfdbfe; padding: 2px 6px; border-radius: 4px; margin-top: 3px; font-weight: bold; display: inline-block; background-color: #eff6ff; }
        .nama-ttd { font-weight: bold; font-size: 10pt; text-decoration: underline; margin-top: 4px; }
        .jabatan-ttd { font-size: 8.5pt; color: #666; }
        .lampiran-box { margin-top: 30px; border-top: 1px solid #ddd; padding-top: 10px; font-size: 8.5pt; color: #555; page-break-inside: avoid; }
    </style>
</head>
<body>

    {{-- Helper Path Resolver: Mencari gambar di storage app/public ATAU public/storage --}}
    @php
        function getPdfImageBase64($path) {
            if (!$path) return null;
            $cleanPath = ltrim($path, '/');
            
            $pathsToTry = [
                storage_path('app/public/' . $cleanPath),
                public_path('storage/' . $cleanPath)
            ];

            foreach ($pathsToTry as $fullPath) {
                if (file_exists($fullPath)) {
                    $mime = mime_content_type($fullPath);
                    $data = base64_encode(file_get_contents($fullPath));
                    return "data:{$mime};base64,{$data}";
                }
            }
            return null;
        }
    @endphp

    {{-- 1. WATERMARK RENDERER --}}
    @if(isset($layout) && $layout->watermark_path)
        @php $wmSrc = getPdfImageBase64($layout->watermark_path); @endphp
        @if($wmSrc)
            <div class="watermark"><img src="{{ $wmSrc }}" alt="Watermark"></div>
        @endif
    @endif

    {{-- 2. KOP SURAT DINAMIS --}}
    <div class="kop-surat">
        <table class="tabel-kop">
            <tr>
                <td class="logo-container">
                    @php $logoSrc = isset($layout) ? getPdfImageBase64($layout->logo_header_path) : null; @endphp
                    @if($logoSrc)
                        <img src="{{ $logoSrc }}" class="logo-img" alt="Logo">
                    @else
                        <strong style="font-size: 26pt; color: #1e3a8a;">LDP</strong>
                    @endif
                </td>
                <td class="kop-teks">
                    <h1 class="nama-perusahaan">{{ $layout->nama_perusahaan ?? 'PT. LINTAS DATA PRIMA' }}</h1>
                    <p class="slogan-perusahaan">{{ $layout->slogan ?? 'Telecommunication & IT Managed Services' }}</p>
                    <p class="kontak-perusahaan">
                        {{ $layout->alamat ?? 'Jl. Sakti No. 12, Yogyakarta' }} | Telp: {{ $layout->telepon ?? '(0274) 415632' }}<br>
                        Email: {{ $layout->email ?? 'sales@ldp.net.id' }} | Web: {{ $layout->website ?? 'www.ldp.net.id' }}
                    </p>
                </td>
            </tr>
        </table>
    </div>

    {{-- 3. META & ISI SURAT --}}
    <table class="meta-surat">
        <tr>
            <td width="15%">Nomor</td><td width="2%">:</td>
            <td width="83%"><strong>{{ $surat->nomor_surat ?? 'Draft/Belum_Diterbitkan' }}</strong></td>
        </tr>
        <tr>
            <td>Lampiran</td><td>:</td>
            <td>{{ ($surat->lampirans && $surat->lampirans->count() > 0) ? $surat->lampirans->count() . ' Berkas' : '-' }}</td>
        </tr>
        <tr>
            <td>Hal</td><td>:</td>
            <td><strong>{{ $surat->template->nama_template ?? 'Surat Resmi' }}</strong></td>
        </tr>
    </table>

    @if($surat->karyawan)
    <div class="penerima-block">
        <p style="margin:0;">Kepada Yth,</p>
        <p style="margin:0; font-weight: bold;">{{ $surat->karyawan->nama_lengkap }}</p>
        <p style="margin:0; font-size: 9.5pt; color: #555;">{{ $surat->karyawan->jabatan->nama_jabatan ?? '' }}</p>
    </div>
    @endif

    <div class="isi-surat">
        {!! $konten !!}
    </div>

{{-- 4. TANDA TANGAN --}}
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
                            @php
                                $isGambarTtd = in_array($appr->jenis_ttd, ['canvas', 'upload_gambar']);
                                $ttdSrc = $isGambarTtd ? getPdfImageBase64($appr->ttd_image_path) : null;
                            @endphp

                            @if($isGambarTtd && $ttdSrc)
                                <img src="{{ $ttdSrc }}" class="img-ttd-canvas">
                                {{-- SPAN BADGE BIRU DIHAPUS DARI SINI --}}
                            @else
                                @if($surat->qr_code_token)
                                    <img src="data:image/svg+xml;base64,{!! base64_encode(SimpleSoftwareIO\QrCode\Facades\QrCode::format('svg')->size(60)->generate(url('/persuratan/verifikasi/' . $surat->qr_code_token))) !!}">
                                    {{-- SPAN BADGE BIRU DIHAPUS DARI SINI --}}
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

    {{-- 5. BANNER FOOTER --}}
    @if(isset($layout) && $layout->banner_footer_path)
        @php $footerSrc = getPdfImageBase64($layout->banner_footer_path); @endphp
        @if($footerSrc)
            <div class="footer-banner"><img src="{{ $footerSrc }}" class="footer-img" alt="Banner Footer"></div>
        @endif
    @endif

</body>
</html>