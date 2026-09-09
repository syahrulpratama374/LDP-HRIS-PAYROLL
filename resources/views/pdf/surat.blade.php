<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Surat Resmi LDP</title>
    <style>
        body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; line-height: 1.5; color: #000; padding: 20px 40px; }
        .kop-surat { text-align: center; border-bottom: 3px solid #000; padding-bottom: 10px; margin-bottom: 30px; }
        .kop-surat h1 { margin: 0; font-size: 20pt; text-transform: uppercase; letter-spacing: 1px; }
        .kop-surat p { margin: 2px 0; font-size: 10pt; }
        .konten-surat { text-align: justify; }
        .signature { margin-top: 50px; text-align: right; }
        .signature p { margin: 0; }
        .signature .ttd-space { height: 80px; }
    </style>
</head>
<body>

    <div class="kop-surat">
        <h1>PT Lintas Data Prima (LDP)</h1>
        <p>Jl. Teknologi No. 1, Kediri, Jawa Timur</p>
        <p>Telp: (0354) 123456 | Email: hrd@ldp.co.id</p>
    </div>

    <div class="konten-surat">
        <!-- Di sinilah parser dari Controller akan menyuntikkan isi surat HTML -->
        {!! $konten !!}
    </div>

</body>
</html>