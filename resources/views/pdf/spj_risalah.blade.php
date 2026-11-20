<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Risalah Perjalanan Dinas - {{ $nomor }}</title>
    <style>
        @include('pdf.partials._gaya', ['pakaiLatar' => (bool) $latarSrc])

        /* Tabel kepala risalah: 3 kolom (logo | judul | perusahaan) lalu baris isian label | nilai */
        .kepala { width: 100%; border-collapse: collapse; font-size: 10.5pt; }
        .kepala td { border: 0.6pt solid #333; padding: 4px 6px; vertical-align: top; }
        .kepala .logo { width: 24%; text-align: center; vertical-align: middle; }
        .kepala .logo img { max-height: 1.3cm; max-width: 3.6cm; }
        .kepala .judul { width: 46%; text-align: center; vertical-align: middle; font-size: 13pt; font-weight: bold; }
        .kepala .perusahaan { width: 30%; text-align: center; vertical-align: middle; font-weight: bold; }
        .kepala .lbl { font-weight: bold; }
        .kepala ol { margin: 0; padding-left: 16px; }

        .bagian { margin: 12px 0 4px 0; font-weight: bold; font-size: 11pt; border-bottom: 0.6pt solid #333; padding-bottom: 2px; }
        .hari { margin-top: 8px; }
        .hari-judul { font-weight: bold; margin: 0 0 3px 0; }
        .hari ol { margin: 0 0 4px 0; padding-left: 18px; }
        .hari li { margin-bottom: 1px; }
        .kosong { color: #777; font-style: italic; margin: 0 0 4px 0; }
        .gambar { text-align: center; margin: 4px 0 8px 0; page-break-inside: avoid; }

        .ttd-risalah { width: 100%; margin-top: 18px; page-break-inside: avoid; }
        .ttd-risalah td { vertical-align: top; }
        .ttd-kanan { width: 40%; text-align: center; font-size: 10pt; }
        .ttd-ruang { height: 2.2cm; }
    </style>
</head>
<body>
    @if($latarSrc)
        @include('pdf.partials._latar', ['latarSrc' => $latarSrc])
    @else
        @include('pdf.partials._footer', ['layout' => $layout])
        @include('pdf.partials._watermark', ['layout' => $layout])
    @endif

    <table class="kepala">
        <tr>
            <td class="logo">
                @if($logoSrc)
                    <img src="{{ $logoSrc }}" alt="LDP">
                @else
                    <strong style="font-size: 20pt; color: #431D6D;">LDP</strong>
                @endif
            </td>
            <td class="judul">RISALAH PERJALANAN DINAS</td>
            <td class="perusahaan">{{ $namaPerusahaan }}</td>
        </tr>
        <tr>
            <td class="lbl">Date/Time</td>
            <td colspan="2">{{ $tanggalPerjalanan }}{{ $waktu ? ' / '.$waktu : '' }}</td>
        </tr>
        <tr>
            <td class="lbl">Place</td>
            <td colspan="2">{{ $tempat }}</td>
        </tr>
        <tr>
            <td class="lbl">Topics</td>
            <td colspan="2">{{ $topik }}</td>
        </tr>
        <tr>
            <td class="lbl">Attendance</td>
            <td colspan="2">
                <ol>
                    @foreach($peserta as $p)
                        <li>{{ $p['nama'] }}{{ $p['posisi'] ? ' ('.$p['posisi'].')' : '' }}</li>
                    @endforeach
                </ol>
            </td>
        </tr>
    </table>

    {{-- Detail di luar tabel agar bisa berlanjut ke halaman berikutnya (baris tabel DomPDF tidak terbelah) --}}
    <div class="bagian">Detail Perjalanan</div>
    @foreach($details as $d)
        <div class="hari">
            <p class="hari-judul">{{ $d['judul'] }}</p>
            @if(count($d['kegiatan']))
                <ol>
                    @foreach($d['kegiatan'] as $k)
                        <li>{!! nl2br(e($k)) !!}</li>
                    @endforeach
                </ol>
            @else
                <p class="kosong">Tidak ada kegiatan dicatat.</p>
            @endif
            @foreach($d['gambar'] as $g)
                <div class="gambar">
                    <img src="{{ $g['src'] }}" style="width: {{ $g['lebar'] }}cm; height: {{ $g['tinggi'] }}cm;">
                </div>
            @endforeach
        </div>
    @endforeach

    <table class="ttd-risalah">
        <tr>
            <td></td>
            <td class="ttd-kanan">
                <div>{{ $penandaTangan['label'] }},</div>
                <div class="ttd-ruang"></div>
                <div class="nama-ttd">{{ $penandaTangan['nama'] }}</div>
                <div class="jabatan-ttd">{{ $penandaTangan['posisi'] }}</div>
            </td>
        </tr>
    </table>
</body>
</html>
