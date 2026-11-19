<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Surat Resmi - {{ $layout->nama_perusahaan ?? 'PT. Lintas Data Prima' }}</title>
    @php
        // Gambar latar A4 penuh (bila ada) menggantikan kop, footer, dan watermark buatan CSS
        $latarSrc = \App\Services\PdfGambarService::dataUri($layout->latar_kop_path ?? null);
    @endphp
    <style>
        @include('pdf.partials._gaya', ['pakaiLatar' => (bool) $latarSrc])

        /* KEPALA SURAT */
        .judul-surat { text-align: center; margin-bottom: 18px; }
        .judul-surat h1 { margin: 0; font-size: 13pt; font-weight: bold; text-transform: uppercase; text-decoration: underline; }
        .judul-surat p { margin: 2px 0 0 0; font-size: 11pt; font-weight: bold; }
        .meta-surat { width: 100%; margin-bottom: 20px; font-size: 11pt; border-collapse: collapse; }
        .meta-surat td { vertical-align: top; padding: 2px 0; }
        .penerima-block { margin-bottom: 20px; font-size: 11pt; }
        .isi-surat { text-align: justify; margin-bottom: 24px; min-height: 150px; }
        .lampiran-box { margin-top: 30px; border-top: 1px solid #ddd; padding-top: 10px; font-size: 10pt; color: #555; page-break-inside: avoid; }
    </style>
</head>
<body>
    @php
        $gayaKepala = $surat->template->gaya_kepala ?? \App\Models\MasterTemplateSurat::GAYA_BLOK_NOMOR;
        $nomor = $surat->nomor_surat ?? 'Draft/Belum_Diterbitkan';

        // Nama & jabatan dari karyawan yang benar-benar menyetujui, bukan dari label/jabatan langkah
        $penandatangan = $surat->approvals->map(function ($appr) {
            $penyetuju = $appr->status === 'Disetujui' ? $appr->userAktual : null;
            $pakaiGambar = in_array($appr->jenis_ttd, ['canvas', 'upload_gambar'], true);

            return [
                'label' => str_replace('okeh', 'oleh', $appr->label_ttd),
                'disetujui' => $appr->status === 'Disetujui',
                'gambar' => $pakaiGambar ? \App\Services\PdfGambarService::dataUri($appr->ttd_image_path) : null,
                'nama' => $penyetuju ? ($penyetuju->karyawan->nama_lengkap ?? $penyetuju->name) : null,
                'jabatan' => $penyetuju ? ($penyetuju->karyawan->jabatan->nama_jabatan ?? '') : ($appr->jabatan->nama_jabatan ?? ''),
            ];
        })->all();

        $qrSrc = $surat->qr_code_token
            ? 'data:image/svg+xml;base64,' . base64_encode(
                SimpleSoftwareIO\QrCode\Facades\QrCode::format('svg')->size(60)->generate(route('surat.verifikasi', $surat->qr_code_token))
            )
            : null;

        $tempatTanggal = ($layout->kota_surat ?? 'Bantul') . ', '
            . \Carbon\Carbon::parse($surat->tanggal_terbit ?? now())->translatedFormat('d F Y');
    @endphp

    {{-- Elemen fixed di awal body agar muncul di setiap halaman --}}
    @if($latarSrc)
        @include('pdf.partials._latar', ['latarSrc' => $latarSrc])
    @else
        @include('pdf.partials._footer', ['layout' => $layout])
        @include('pdf.partials._watermark', ['layout' => $layout])
        @include('pdf.partials._kop', ['layout' => $layout])
    @endif

    @if($gayaKepala === \App\Models\MasterTemplateSurat::GAYA_JUDUL_TENGAH)
        {{-- Gaya A: judul tengah bergaris bawah + nomor --}}
        <div class="judul-surat">
            <h1>{{ $surat->template->nama_template ?? 'Surat Resmi' }}</h1>
            <p>Nomor : {{ $nomor }}</p>
        </div>
    @else
        {{-- Gaya B: blok Nomor / Lampiran / Hal --}}
        <table class="meta-surat">
            <tr>
                <td width="15%">Nomor</td><td width="2%">:</td>
                <td width="83%"><strong>{{ $nomor }}</strong></td>
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
    @endif

    <div class="isi-surat">
        {!! $konten !!}
    </div>

    @include('pdf.partials._tanda_tangan', [
        'tempatTanggal' => $tempatTanggal,
        'penandatangan' => $penandatangan,
        'qrSrc' => $qrSrc,
    ])

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
