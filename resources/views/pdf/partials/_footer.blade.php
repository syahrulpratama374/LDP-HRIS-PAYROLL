{{--
    Footer setiap halaman: kontak kantor + logo ISO (kiri), banner (kanan).
    Label tebal ungu LDP, isi di baris berikutnya.
    Variabel: $layout (PengaturanSuratLayout|null). Gambar yang belum diunggah dilewati tanpa error.
    Letakkan di awal <body> agar DomPDF mengulangnya di setiap halaman.
--}}
@php
    $isoSrcs = collect($layout->logo_iso_paths ?? [])
        ->map(fn ($p) => \App\Services\PdfGambarService::dataUri($p))
        ->filter();
    $bannerSrc = \App\Services\PdfGambarService::dataUri($layout->banner_footer_path ?? null);
@endphp
<div class="footer">
    <table class="footer-tata">
        <tr>
            <td class="footer-kiri">
                <table class="footer-kontak">
                    <tr>
                        <td style="width: 46%;">
                            <span class="label-ungu">Head Office</span>
                            {{ $layout->alamat ?? 'Darmo Residence No. 1, Kasihan, Bantul - Yogyakarta' }}
                        </td>
                        <td style="width: 24%;">
                            <span class="label-ungu">Hotline</span>
                            {{ $layout->telepon ?? '(0274) 415632' }}
                        </td>
                        <td style="width: 30%;">
                            <span class="label-ungu">Email</span>
                            {{ $layout->email ?? 'sales@ldp.net.id' }}<br>
                            {{ $layout->website ?? 'www.ldp.net.id' }}
                        </td>
                    </tr>
                </table>
                @if($isoSrcs->isNotEmpty())
                    <div class="footer-iso">
                        @foreach($isoSrcs as $src)<img src="{{ $src }}" alt="ISO">@endforeach
                    </div>
                @endif
            </td>
            <td class="footer-banner">
                @if($bannerSrc)<img src="{{ $bannerSrc }}" alt="Banner">@endif
            </td>
        </tr>
    </table>
</div>
