{{--
    Latar A4 penuh (kop + watermark + footer + ISO + banner dalam satu gambar), diulang di setiap halaman.
    Elemen fixed di DomPDF diposisikan relatif terhadap area isi, jadi digeser negatif sebesar margin
    halaman (lihat _gaya, mode latar: atas 3cm, kiri 2.5cm).
    Variabel: $latarSrc (data URI).
--}}
<div class="latar-kop"><img src="{{ $latarSrc }}" alt=""></div>
