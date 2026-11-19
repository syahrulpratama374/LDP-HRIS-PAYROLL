{{--
    Gaya bersama PDF resmi LDP (surat keluar, SPJ, dst.). Sertakan di dalam <style>.
    Variabel: $pakaiLatar (bool) — true bila memakai gambar latar A4 penuh (_latar).
    - Mode latar  : margin menyesuaikan kop resmi (atas 3cm, kanan 1.8cm, bawah 6.5cm, kiri 2.5cm)
                    agar isi tidak menimpa logo, footer, maupun banner pada gambar latar.
    - Mode partial: area isi A4 = 17cm x 24,7cm (atas 1,2cm, kiri/kanan 2cm, bawah 3,8cm untuk footer);
                    posisi footer & watermark dihitung dari angka ini (lihat _footer dan _watermark).
--}}
@include('pdf.partials._fonts')
@if(!empty($pakaiLatar))
@page { margin: 3cm 1.8cm 6.5cm 2.5cm; }
.latar-kop { position: fixed; top: -3cm; left: -2.5cm; width: 21cm; height: 29.7cm; z-index: -1000; }
.latar-kop img { width: 21cm; height: 29.7cm; }
@else
@page { margin: 1.2cm 2cm 3.8cm 2cm; }
@endif
/* DomPDF menghitung tinggi baris dari kotak glyph Carlito (lebih tinggi dari ukuran font), jadi 1.05 di sini
   menghasilkan spasi efektif setara ±1.15 di Word. */
body { font-family: 'Carlito', sans-serif; font-size: 11pt; color: #222; line-height: 1.05; }

/* KOP: logo kiri, nama perusahaan rata kanan */
/* KOP: tanpa garis bawah, sesuai gaya perusahaan */
.kop { width: 100%; border-collapse: collapse; margin-bottom: 18px; }
.kop td { vertical-align: middle; padding: 0 0 8px 0; }
.kop .kop-logo { width: 45%; text-align: left; }
.kop .kop-logo img { max-height: 2cm; max-width: 6cm; }
.kop .kop-nama { width: 55%; text-align: right; font-size: 16pt; font-weight: bold; color: #1e3a8a; letter-spacing: 0.5px; }

/* WATERMARK: lebar 12cm di tengah area isi (17 x 24,7cm). DomPDF tidak mendukung transform dan
   mengabaikan tinggi tabel, jadi posisi dihitung absolut: kiri (17-12)/2, atas (24,7-12)/2.
   Pas di tengah untuk gambar persegi (aset disarankan persegi). */
.watermark { position: fixed; top: 6.35cm; left: 2.5cm; width: 12cm; opacity: 0.07; z-index: -1000; text-align: center; }
.watermark img { width: 12cm; }

/* FOOTER: kontak + ISO di kiri, banner di kanan; tampil di setiap halaman, di dalam margin bawah.
   Tanpa background agar PNG transparan tetap transparan. */
.footer { position: fixed; bottom: -3.4cm; left: 0; right: 0; height: 3.2cm; }
.footer table { border-collapse: collapse; }
.footer td { padding: 0; background: none; }
.footer .footer-tata { width: 100%; }
.footer .footer-kiri { width: 54%; vertical-align: bottom; }
.footer .footer-banner { width: 46%; vertical-align: bottom; text-align: right; }
.footer .footer-banner img { width: 7.5cm; }
.footer .footer-kontak { width: 100%; font-size: 8pt; line-height: 1.3; color: #333; }
.footer .footer-kontak td { vertical-align: top; padding-right: 8px; }
.footer .label-ungu { display: block; font-weight: bold; color: #653A92; }
.footer .footer-iso { margin-top: 5px; }
.footer .footer-iso img { height: 1.1cm; margin-right: 6px; }

/* TANDA TANGAN (10pt) */
.tempat-tanggal { text-align: right; margin: 0 0 12px 0; font-size: 10pt; }
.ttd-container { width: 100%; margin-top: 16px; page-break-inside: avoid; }
.ttd-table { width: 100%; border-collapse: collapse; text-align: center; }
.ttd-table td { vertical-align: top; padding: 5px 10px; }
.label-ttd { font-weight: bold; font-size: 10pt; margin-bottom: 6px; }
.qr-box { margin: 4px auto; min-height: 75px; text-align: center; }
.img-ttd { max-height: 60px; max-width: 150px; }
.menunggu-ttd { height: 60px; line-height: 60px; color: #aaa; font-style: italic; font-size: 10pt; }
.nama-ttd { font-weight: bold; font-size: 10pt; text-decoration: underline; margin-top: 4px; }
.jabatan-ttd { font-size: 10pt; color: #555; }
