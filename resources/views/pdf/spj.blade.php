<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>SPJ Biaya Perjalanan Dinas - {{ $nomor }}</title>
    @php
        $rp = fn ($n) => $n === null ? '-' : 'Rp '.number_format((float) $n, 0, ',', '.');
        // Subtotal, TOTAL & Terbilang dihitung dari baris yang ditampilkan di tabel ini
        ['subtotalUangHarian' => $subtotalUangHarian, 'subtotalAkomodasi' => $subtotalAkomodasi,
         'total' => $total, 'terbilang' => $terbilang] = \App\Services\Spj\SpjPdfService::ringkasan($uangHarian, $akomodasi);
        // QR berdiri sendiri hanya bila tidak ada penanda tangan yang sudah memakai QR sebagai pengganti TTD
        $qrDiKolomTtd = collect($penandatangan)->contains(fn ($t) => $t['disetujui'] && empty($t['gambar']));
    @endphp
    <style>
        @include('pdf.partials._gaya', ['pakaiLatar' => (bool) $latarSrc])

        .judul-surat { text-align: center; margin-bottom: 10px; }
        .judul-surat h1 { margin: 0; font-size: 13pt; font-weight: bold; text-decoration: underline; }
        .judul-surat p { margin: 3px 0 0 0; font-size: 11pt; font-weight: bold; }

        .pembuka { margin: 0 0 6px 0; }
        .identitas { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
        .identitas td { vertical-align: top; padding: 0; }
        .identitas .lbl { width: 22%; }
        .identitas .sep { width: 2%; }

        /* Tabel rincian: kepala diulang di setiap halaman (table-header-group), baris tidak terpotong */
        .rincian { width: 100%; border-collapse: collapse; font-size: 9.5pt; line-height: 1; }
        .rincian thead { display: table-header-group; }
        .rincian tr, .rincian tbody { page-break-inside: avoid; }
        .rincian th, .rincian td { border: 0.6pt solid #333; padding: 1px 4px; vertical-align: top; }
        .rincian th { background: #e5e7eb; font-weight: bold; text-align: center; vertical-align: middle; }
        .rincian th.atas { border-bottom: none; }
        .rincian th.bawah { border-top: none; }
        .rincian .tengah { text-align: center; }
        .rincian .angka { text-align: right; white-space: nowrap; }
        .rincian .tgl { text-align: center; white-space: nowrap; }
        .rincian .bagian td { font-weight: bold; background: #f3f4f6; }
        .rincian .subtotal td { font-weight: bold; }
        .rincian .total td { font-weight: bold; background: #e5e7eb; }
        .rincian .kosong td { color: #666; font-style: italic; }
        .rincian .ket { font-size: 8.5pt; }

        /* Terbilang + catatan di kiri, QR verifikasi di kanan (satu baris agar TTD muat di halaman 1) */
        .penutup { width: 100%; border-collapse: collapse; margin-top: 6px; }
        .penutup td { vertical-align: top; padding: 0; }
        .terbilang { margin: 0 0 2px 0; }
        .catatan { margin: 0; font-size: 9.5pt; font-style: italic; }
        .qr-verifikasi { width: 4.2cm; text-align: center; font-size: 7pt; color: #555; }
        .qr-verifikasi img { width: 1.5cm; height: 1.5cm; }
    </style>
</head>
<body>
    {{-- Elemen fixed di awal body agar muncul di setiap halaman --}}
    @if($latarSrc)
        @include('pdf.partials._latar', ['latarSrc' => $latarSrc])
    @else
        @include('pdf.partials._footer', ['layout' => $layout])
        @include('pdf.partials._watermark', ['layout' => $layout])
        @include('pdf.partials._kop', ['layout' => $layout])
    @endif

    <div class="judul-surat">
        <h1>SPJ BIAYA PERJALANAN DINAS</h1>
        <p>Nomor : {{ $nomor }}</p>
        @if($spj->status === \App\Models\Spj::STATUS_DIBATALKAN)
            <p style="color: #b91c1c; margin-top: 4px;">DIBATALKAN{{ $spj->dibatalkan_pada ? ' pada '.$spj->dibatalkan_pada->locale('id')->translatedFormat('d F Y') : '' }}</p>
        @endif
    </div>

    @if($tanggalRisalah)
        <p class="pembuka">Sesuai dengan Risalah Perjalanan Dinas tanggal {{ $tanggalRisalah }}, dengan ini kami sampaikan rincian biaya perjalanan dinas sebagai berikut:</p>
    @endif

    <table class="identitas">
        @foreach($pesertas as $i => $p)
            <tr>
                <td class="lbl">{{ $i === 0 ? 'Nama / Jabatan' : '' }}</td>
                <td class="sep">{{ $i === 0 ? ':' : '' }}</td>
                <td>{{ count($pesertas) > 1 ? ($i + 1).'. ' : '' }}<strong>{{ $p['nama'] }}</strong> / {{ $p['posisi'] }}</td>
            </tr>
        @endforeach
        <tr><td class="lbl">Department</td><td class="sep">:</td><td>{{ $departemen }}</td></tr>
        <tr><td class="lbl">Tujuan</td><td class="sep">:</td><td>{{ $tujuan }}</td></tr>
        <tr><td class="lbl">Keperluan</td><td class="sep">:</td><td>{{ $keperluan }}</td></tr>
        <tr><td class="lbl">Tanggal</td><td class="sep">:</td><td>{{ $tanggalPerjalanan }}</td></tr>
    </table>

    <table class="rincian">
        {{-- Tanpa rowspan: DomPDF hanya mengulang thead dengan andal bila tiap baris berdiri sendiri.
             Sel kosong baris kedua menyatu dengan sel di atasnya (garis tengah dihilangkan). --}}
        <thead>
            <tr>
                <th class="atas" style="width: 5%;">NO</th>
                <th class="atas" style="width: 24%;">PERINCIAN BIAYA</th>
                <th class="atas" style="width: 20%;">TGL</th>
                <th colspan="2" style="width: 28%;">JUMLAH</th>
                <th class="atas" style="width: 23%;">KET</th>
            </tr>
            <tr>
                <th class="bawah"></th>
                <th class="bawah"></th>
                <th class="bawah"></th>
                <th style="width: 13%;">Harian</th>
                <th style="width: 15%;">Total</th>
                <th class="bawah"></th>
            </tr>
        </thead>
        {{-- Tiap baris dibungkus <tbody> sendiri: DomPDF hanya menyalin thead ke halaman berikutnya bila
             tabel terbelah di antara row group (bukan di dalam satu tbody), dan bila baris pertama tidak muat
             seluruh tabel pindah halaman sehingga kepala tabel tidak tertinggal sendirian. --}}
            {{-- A. UANG HARIAN --}}
            <tbody><tr class="bagian"><td class="tengah">A</td><td colspan="5">UANG HARIAN</td></tr></tbody>
            @foreach($uangHarian as $i => $r)
                <tbody><tr>
                    <td class="tengah">{{ $i + 1 }}</td>
                    <td>{{ $r['perincian'] }}</td>
                    <td class="tgl">{{ $r['tgl'] }}</td>
                    <td class="angka">{{ $rp($r['harian']) }}</td>
                    <td class="angka">{{ $rp($r['total']) }}</td>
                    <td class="ket">{{ $r['ket'] }}</td>
                </tr></tbody>
            @endforeach
            <tbody><tr class="subtotal">
                <td></td><td colspan="3">Subtotal Uang Harian</td>
                <td class="angka">{{ $rp($subtotalUangHarian) }}</td><td></td>
            </tr></tbody>

            {{-- B. AKOMODASI (reimburse; terisi dari nota tervalidasi) --}}
            <tbody><tr class="bagian"><td class="tengah">B</td><td colspan="5">AKOMODASI</td></tr></tbody>
            @forelse($akomodasi as $i => $r)
                <tbody><tr>
                    <td class="tengah">{{ $i + 1 }}</td>
                    <td>{{ $r['perincian'] }}</td>
                    <td class="tgl">{{ $r['tgl'] }}</td>
                    <td class="angka">{{ $rp($r['harian'] ?? null) }}</td>
                    <td class="angka">{{ $rp($r['total']) }}</td>
                    <td class="ket">{{ $r['ket'] }}</td>
                </tr></tbody>
            @empty
                <tbody><tr class="kosong">
                    <td class="tengah">-</td>
                    <td colspan="3">Belum ada nota akomodasi yang divalidasi.</td>
                    <td class="angka">{{ $rp(0) }}</td><td></td>
                </tr></tbody>
            @endforelse
            <tbody><tr class="subtotal">
                <td></td><td colspan="3">Subtotal Akomodasi</td>
                <td class="angka">{{ $rp($subtotalAkomodasi) }}</td><td></td>
            </tr></tbody>

            <tbody><tr class="total">
                <td></td><td colspan="3">TOTAL</td>
                <td class="angka">{{ $rp($total) }}</td><td></td>
            </tr></tbody>
    </table>

    <table class="penutup">
        <tr>
            <td>
                <p class="terbilang"><strong>Terbilang :</strong> <em>{{ $terbilang }}</em></p>
                <p class="catatan">* Akomodasi dan lainnya menggunakan sistem reimburse.</p>
            </td>
            @if($qrSrc && ! $qrDiKolomTtd)
                <td class="qr-verifikasi">
                    <img src="{{ $qrSrc }}"><br>Pindai untuk verifikasi keaslian dokumen
                </td>
            @endif
        </tr>
    </table>

    @include('pdf.partials._tanda_tangan', [
        'tempatTanggal' => $tempatTanggal,
        'penandatangan' => $penandatangan,
        'qrSrc' => $qrSrc,
    ])

</body>
</html>
