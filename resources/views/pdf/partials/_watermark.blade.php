{{-- Watermark logo di tengah halaman. Variabel: $layout (PengaturanSuratLayout|null) --}}
@php $wmSrc = \App\Services\PdfGambarService::dataUri($layout->watermark_path ?? null, abuAbu: true); @endphp
@if($wmSrc)
    <div class="watermark"><img src="{{ $wmSrc }}" alt="Watermark"></div>
@endif
