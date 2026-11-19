{{-- Kop surat: logo kiri, nama perusahaan rata kanan. Variabel: $layout (PengaturanSuratLayout|null) --}}
@php $logoSrc = \App\Services\PdfGambarService::dataUri($layout->logo_header_path ?? null); @endphp
<table class="kop">
    <tr>
        <td class="kop-logo">
            @if($logoSrc)
                <img src="{{ $logoSrc }}" alt="Logo">
            @else
                <strong style="font-size: 26pt; color: #1e3a8a;">LDP</strong>
            @endif
        </td>
        <td class="kop-nama">{{ $layout->nama_perusahaan ?? 'PT. LINTAS DATA PRIMA' }}</td>
    </tr>
</table>
