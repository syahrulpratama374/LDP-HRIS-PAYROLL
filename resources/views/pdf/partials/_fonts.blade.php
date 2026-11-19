{{--
    Font isi PDF: Carlito (metrik sama dengan Calibri, lisensi OFL; resources/fonts/carlito).
    DomPDF memasang metriknya ke storage/fonts saat render pertama. Fallback: sans-serif (Helvetica).
--}}
@foreach ([
    ['Carlito-Regular.ttf', 'normal', 'normal'],
    ['Carlito-Bold.ttf', 'bold', 'normal'],
    ['Carlito-Italic.ttf', 'normal', 'italic'],
    ['Carlito-BoldItalic.ttf', 'bold', 'italic'],
] as [$berkas, $tebal, $gaya])
@font-face {
    font-family: 'Carlito';
    src: url('{{ resource_path('fonts/carlito/'.$berkas) }}') format('truetype');
    font-weight: {{ $tebal }};
    font-style: {{ $gaya }};
}
@endforeach
