{{--
    Blok tempat-tanggal + kolom tanda tangan.
    Variabel:
    - $tempatTanggal (string|null) mis. "Bantul, 26 November 2026"
    - $penandatangan (array) tiap item: label, disetujui (bool), gambar (data URI|null), nama, jabatan
    - $qrSrc (string|null) data URI QR verifikasi; dipakai bila penanda tangan tanpa gambar TTD
--}}
<div class="ttd-container">
    @if(!empty($tempatTanggal))
        <p class="tempat-tanggal">{{ $tempatTanggal }}</p>
    @endif

    @php $lebar = count($penandatangan) > 0 ? floor(100 / count($penandatangan)) : 100; @endphp
    <table class="ttd-table">
        <tr>
            @foreach($penandatangan as $ttd)
                <td style="width: {{ $lebar }}%;">
                    <div class="label-ttd">{{ $ttd['label'] }}</div>
                    <div class="qr-box">
                        @if($ttd['disetujui'])
                            @if(!empty($ttd['gambar']))
                                <img src="{{ $ttd['gambar'] }}" class="img-ttd">
                            @elseif(!empty($qrSrc))
                                <img src="{{ $qrSrc }}">
                            @endif
                        @else
                            <div class="menunggu-ttd">[ Menunggu TTD ]</div>
                        @endif
                    </div>
                    <div class="nama-ttd">{{ $ttd['nama'] ?: '........................' }}</div>
                    <div class="jabatan-ttd">{{ $ttd['jabatan'] }}</div>
                </td>
            @endforeach
        </tr>
    </table>
</div>
