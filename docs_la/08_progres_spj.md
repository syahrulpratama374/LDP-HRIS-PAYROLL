# 08 — Progres Modul SPJ Perjalanan Dinas (catatan serah terima)

> Dokumen ini ditulis agar sesi AI/developer baru **tanpa konteks percakapan sebelumnya** bisa langsung
> melanjutkan. Baca seluruhnya sebelum mengubah kode. Branch kerja: `fix/keuangan-la`.
> Terakhir diperbarui: 2026-11-20. **Modul SPJ baru B1–B9 selesai** (semua lolos uji manual pemilik).
> Image `ldp_app` sudah di-rebuild (GD JPEG, `docker/php/ldp.ini` 256M/6M, nginx 64m); test lengkap lolos tanpa skip.
>
> **Urutan kerja baru (ditetapkan pemilik): B5 → B8a (PDF SPJ) → B6 → B7 → B8b (Risalah) → B9.**

---

## 1. Gambaran modul

### SPJ model BARU (sedang dibangun)
- **Satu SPJ untuk banyak peserta** (karyawan). Tiap peserta punya rincian dan rekening sendiri.
- **Di luar payroll.** Finance membayar uang harian dan reimburse langsung, lalu mencatatnya dengan
  unggah bukti transfer. `PayrollCalculator`/`PayrollFinalizer` hanya membaca tabel lama `pengajuan_spjs`,
  jadi SPJ baru (tabel `spjs`) **tidak pernah** masuk payroll tanpa perlu mengubah kode payroll
  (dikunci test `PersetujuanSpjTest::test_spj_baru_yang_disetujui_tidak_pernah_masuk_payroll`).
- **Nomor & PDF lewat mesin persuratan.** Jenis surat `SPJ-PD` (template id 16, gaya kepala `judul_tengah`),
  penerbit default `LDP-HC` (bisa diganti lewat dropdown unit penerbit). Nomor terbit di persetujuan
  terakhir lewat `PenomoranSuratService::terbitkan('SPJ-PD', <kode penerbit>, <waktu>, $spj)`.
  PDF (bagian B8) memakai partial PDF persuratan dengan latar kop A4 penuh.
- **Rute persetujuan:** HC → Finance → Direktur (jabatan CEO), berapa pun nominalnya, disimpan sebagai
  rute approval template SPJ-PD (bukan hard-code).
- URL: `/perjalanan-dinas` (route `spj.*`). Menu "Perjalanan Dinas (SPJ)" (`spj.index`) dimiliki semua role.

### SPJ model LAMA (dibiarkan sampai B9)
- Tabel `pengajuan_spjs` + `komponen_biaya_spjs`, controller `PengajuanSpjController`, halaman `Pages/Spj/*`.
  Satu SPJ per karyawan, plafon per golongan, dicairkan lewat payroll ("Pencairan SPJ").
- Route sudah diganti nama ke **`spj.lama.*`** dengan URL tetap (`/spj`, `/spj/ajukan`, `/spj/{id}/laporan`).
  Nama `spj.lama.*` tercakup menu `spj.index` (aturan prefix `DynamicRolePermission`), jadi masih bisa dibuka.
  Approval lama `admin.spj.*` tetap.
- Payroll lama, tabel lama, dan test lama (`MesinPayrollTest`, `AbsensiSpjTest`) **tidak disentuh**
  (di `AbsensiSpjTest` hanya nama route yang disesuaikan ke `spj.lama.*`).
- Dua SPJ lama milik `staff.hc1` (data uji, id 1 `Selesai` & id 2 `Pending`) sudah diubah ke `Ditolak` lewat
  migrasi `2026_11_21_100400_batalkan_spj_lama_data_uji` agar tidak ikut cair di payroll November.

---

## 2. Keputusan bisnis final

### 2.1 Sebelas keputusan awal
1. Satu SPJ berisi banyak peserta; tiap peserta punya rincian dan rekening sendiri.
2. Pembayaran **tidak** lewat payroll. Finance mencatat pembayaran uang harian dan reimburse dengan unggah
   bukti transfer. Pencairan SPJ di payroll dihentikan untuk SPJ baru tanpa merusak data/test payroll lama
   (pendekatan: tabel terpisah yang tidak dibaca payroll).
3. Kategori tarif per karyawan (`karyawans.kategori_tarif_spj`, diisi HC, bisa diubah per orang):
   Direksi / Manager / Staff. Nilai awal: kode jabatan CEO/MD → Direksi; MGR → Manager; lainnya Staff.
   "Head" (mis. Fahla) berjenjang MGR tetapi tarif Staff, jadi **perhitungan selalu membaca kolom kategori,
   tidak pernah menurunkan dari jenjang jabatan**.
4. Jumlah hari = tanggal pulang − tanggal berangkat + 1.
5. Uang harian = tarif uang harian (provinsi × kategori) × hari, per peserta. Tetap, tanpa nota.
6. Penginapan: reimburse sesuai nota, maksimal tarif penginapan (provinsi × kategori) × malam. Kelebihan
   ditanggung peserta (dibayar = min(nota, batas)). Tiket/transport/lainnya sesuai nota.
7. Master tarif dikelola HC (menu Master Data; HC & Admin mengubah, Finance hanya melihat). Kolom: provinsi,
   jenis (uang_harian/penginapan), kategori, nominal, satuan OH, berlaku_mulai. Baris tarif yang terpotong di
   sumber tidak dikarang.
8. Notifikasi selisih: saat nota penginapan divalidasi, bandingkan dengan tarif. Lebih mahal → peringatan;
   lebih murah → info. Tampil di dashboard HC & Finance, plus halaman rekap per provinsi (rata-rata nota vs
   tarif, jumlah kejadian, persentase selisih).
9. Nomor & PDF lewat mesin persuratan (jenis SPJ-PD, penerbit default LDP-HC, bisa diganti). Nomor terbit
   saat persetujuan terakhir.
10. Semua karyawan boleh membuat SPJ. Rute selalu HC → Finance → Direktur (HC = role HC, Finance = role
    Finance, Direktur = jabatan kode CEO), disimpan sebagai rute template SPJ-PD. Pengaju tidak boleh
    menyetujui SPJ-nya; delegasi berstatus 'Aktif' berlaku.
11. Risalah diisi SETELAH perjalanan oleh koordinator (atau pengaju): detail per tanggal + unggah rundown/foto.
    PDF risalah ikut tersedia.

### 2.2 Jawaban 10 pertanyaan Tahap 1
1. SPJ lama dibiarkan sebagai model lama; dua data uji dibatalkan (sudah, B1). Bug `laporan_hasil` yang tidak
   ada di `$fillable` diperbaiki di **B9**.
2. Dropdown provinsi hanya yang punya tarif uang harian. Nota penginapan di provinsi tanpa tarif penginapan
   divalidasi manual Finance **tanpa** catatan selisih. Laporkan provinsi yang belum ada di ringkasan akhir.
3. Malam = hari − 1; batas penginapan berlaku untuk **total** nota penginapan per peserta (bukan per lembar).
4. Kolom `karyawans.nama_posisi` (judul di bagan, mis. "Head of Artistic - Creative Team") — sudah (B3).
   PDF SPJ memakai `nama_posisi`, fallback nama jenjang jabatan. Pemakaian di Surat Keluar dikerjakan nanti.
5. Rekening: lengkap untuk HC, Finance, Admin; selain itu disamarkan (`****1234`), termasuk di PDF. Draf
   menampilkan peringatan peserta tanpa rekening; Ajukan ditolak sampai semua peserta punya rekening.
6. Pengaju tidak boleh menyetujui SPJ-nya; **peserta juga tidak boleh** menyetujui SPJ yang memuat dirinya.
   Jalan keluarnya Delegasi Wewenang; pesan error wajib menyarankannya.
7. Urutan nomor: mode **global** dulu (mengikuti pengaturan `penomoran_surat_mode`).
8. "Department" di PDF: gabungan unik departemen peserta, dipisah koma.
9. Tanggal risalah awal diisi manual & opsional; bila kosong, kalimat "Sesuai dengan Risalah Perjalanan Dinas
   tanggal …" tidak ditampilkan di PDF.
10. Status `Selesai` ditetapkan Finance, hanya bila: uang harian semua peserta sudah dicatat dibayar, semua
    nota sudah divalidasi, dan risalah sudah terisi.
- Kategori tarif awal (tabel di §5) sudah dikonfirmasi benar.

### 2.3 Keputusan tambahan
- **Peserta melihat rekening MILIKNYA SENDIRI secara lengkap**; rekening orang lain tetap disamarkan bagi
  non-HC/Finance/Admin. Berlaku di form, daftar, detail, dan nanti PDF (`RekeningSpj::untuk($viewer, $enc, $karyawanIdPemilik)`).
- **Batas lama perjalanan 60 hari** dipertahankan (`SpjController::MAKS_HARI`).
- **Tanggal berlaku semua tarif seed = 2026-01-01**, menunggu konfirmasi perusahaan.
- **Pengaju, peserta, dan Admin tidak boleh menyetujui** (403) — pakai Delegasi Wewenang.
- **Mode nomor global**: SPJ-PD berbagi urutan tahunan dengan Surat Keluar (mis. `004/SPJ-PD/LDP-HC/XI/2026`).
- Admin tidak menandatangani dokumen apa pun di persuratan & SPJ (Surat Keluar juga sudah begitu).
- Penanda tangan PDF diambil dari approver asli (`user_id_aktual`), bukan dari label langkah.

---

## 3. Status B1–B9

Prasyarat persuratan (sudah selesai sebelum SPJ):
| Commit | Isi |
|---|---|
| `470ef12` | Mesin penomoran surat: `PenomoranSuratService`, unit penerbit, penghitung terkunci, register `nomor_surat_terbits`, mode urutan |
| `6feea5d` | Perapian persuratan: otorisasi approval (Direksi via kode jabatan, delegasi Aktif, tolak pembuat & Admin), penanda tangan PDF dari approver asli |
| `72cac21` | Tata letak PDF: partial `resources/views/pdf/partials/` (`_gaya`, `_fonts`, `_latar`, `_kop`, `_footer`, `_watermark`, `_tanda_tangan`), latar kop A4 penuh, font Carlito, `PdfGambarService` |

| Bagian | Status | Commit | Ringkasan |
|---|---|---|---|
| **B1** | ✅ Selesai | `d4ced41` | Tabel `master_tarif_spjs` + `MasterTarifSpjSeeder` (firstOrCreate, tidak menimpa); kolom `karyawans.kategori_tarif_spj` + migrasi data kategori awal (fahla, mikha, elvira = Staff); menu "Master Tarif SPJ" lewat migrasi data; halaman Master Tarif SPJ (matriks tarif + kategori per karyawan; HC/Admin ubah, Finance lihat); pembatalan 2 SPJ lama data uji |
| **B2** | ✅ Selesai | `ba117e0` | `rute_approval_templates` + `tipe_penyetuju` (jabatan/role) & `role_id`, `jabatan_id` nullable; rute SPJ-PD (role HC "Diajukan Oleh" → role Finance "Diperiksa Oleh" → jabatan CEO "Disetujui Oleh"); Surat Keluar menyembunyikan & menolak template berbasis role |
| **B3** | ✅ Selesai | `130f600` | `SpjKalkulator` + `Terbilang`; tabel `spjs` & `spj_pesertas` (snapshot); form baru `/perjalanan-dinas/buat` (detail, peserta, tabel rincian meniru dokumen, Simpan Draf/Ajukan); daftar SPJ; `nama_posisi`; rekening DUMMY uji (fahla `9990000001`, staff.cre1 `9990000002`); route lama → `spj.lama.*` |
| **B4** | ✅ Selesai (uji manual lolos: nomor `004/SPJ-PD/LDP-HC/XI/2026`, timeline yoga → muslih → ceo, rekening sesuai peran) | `86564a7` | Tabel `spj_approvals`; `OtorisasiApprovalSpj`; Setujui (SignModal) & Tolak (alasan wajib); nomor SPJ-PD di persetujuan terakhir; halaman detail + timeline; "Menunggu Anda" di daftar; migrasi pengaman langkah untuk SPJ Diajukan tanpa langkah |
| **B5** | ✅ Selesai (uji manual lolos: monitor HC 27-11-2026 menampilkan kedua peserta SPJ 004 Dinas Luar; 26-11 & 30-11 tidak; Auto-Alpha manual dilewati, tercakup test) | `dacc99e` | `DinasLuarService` (SPJ lama + semua peserta SPJ baru Disetujui/Selesai) menggantikan 3 pemakaian `PengajuanSpj::aktifPada`; test `tests/Feature/Spj/DinasLuarSpjTest.php` |
| **B8a** | ✅ Selesai (cek visual pemilik lolos; kepala tabel berulang di hal. 2) | `2ac58a0` | `SpjPdfService` + `pdf/spj.blade.php`; route `spj.pdf` (hanya SPJ bernomor & yang berhak melihat); tombol "Cetak PDF" di detail; verifikasi QR publik `verifikasi.spj` (`/verifikasi/spj/{token}`, tanpa rekening); test `PdfSpjTest` |
| **B6** | ✅ Selesai (uji manual lolos) | `ac56d94` | `spj_biayas`, `spj_selisih_penginapans`, `ReimburseSpjService`, `SpjBiayaController`, kartu "Nota & Reimburse" di detail, rekap `spj.rekap-selisih`, panel dashboard HC/Finance/Admin, AKOMODASI PDF dari nota tervalidasi; test `ReimburseSpjTest` |
| **B7** | ✅ Selesai (uji manual lolos) | `7e4c61a` | `spj_pembayarans`, `PembayaranSpjService`, `SpjPembayaranController`, kartu "Pembayaran" di detail; test `PembayaranSpjTest` |
| **B8b** | ✅ Selesai (uji manual lolos) | `57b34e6` | Koordinator (form + detail), `spj_risalahs`/`_details`/`_lampirans`, `RisalahSpjService`, `SpjRisalahController`, halaman `Risalah.jsx`, `pdf/spj_risalah.blade.php`, tombol "Cetak Risalah"; perbaikan koordinator ter-reset saat diajukan; test `RisalahSpjTest` |
| **B9** | ✅ Selesai (uji manual lolos: Tandai Selesai di SPJ 18–20 Nov, pembatalan pengaju & HC, form lama dialihkan, menu & dashboard, unggah foto > 1 MB) | (commit B9) | `PenutupanSpjService` + `SpjPenutupanController` (Tandai Selesai + daftar syarat, Batalkan SPJ), kolom penutupan di `spjs`, SPJ lama dipensiunkan, `laporan_hasil` di `$fillable`, menu "Approval SPJ" → `spj.menunggu`, dashboard Supervisor & pintasan memakai SPJ baru; test `PenutupanSpjTest` |

Hasil terakhir: **227 test lolos tanpa skip** setelah rebuild image (GD JPEG aktif); `npm run build` berhasil.

**Data demo:** SPJ `004/SPJ-PD/LDP-HC/XI/2026` (Jawa Timur, 27–29 Nov 2026) dipertahankan untuk demo — pembayaran
lunas, menunggu risalah diisi setelah 27 November, lalu Tandai Selesai. (sqlite `:memory:`), `npm run build` berhasil.

### Langkah uji manual B4 (sudah dijalankan & lolos, 2026-11-20)
1. **Login `staff.cre1`:** buat SPJ Jawa Timur 27–29 November 2026 dengan peserta fahla dan Staff Creative 1,
   lalu klik **Ajukan**.
   - Pindah ke detail berstatus "Diajukan".
   - Timeline 3 langkah: Diajukan Oleh (Role HC, aktif), Diperiksa Oleh (Role Finance), Disetujui Oleh
     (Chief Executive Officer).
2. **Login `fahla`:** buka SPJ itu. Tidak ada tombol Setujui; ada keterangan "Peserta tidak dapat menyetujui
   SPJ yang memuat dirinya… Delegasi Wewenang".
3. **Login `syahrul.admin`:** SPJ terlihat, tidak ada tombol Setujui; ada keterangan "Admin tidak dapat
   menyetujui… Delegasi Wewenang".
4. **Login `muslih` / `ceo`:** muslih (Finance) melihat SPJ tanpa tombol Setujui; ceo belum bisa membukanya (403).
5. **Login `yoga`:** daftar menunjukkan "Menunggu Anda" → klik **Tinjau**.
   - Coba **Tolak** dengan alasan kosong → muncul pesan "wajib diisi"; batalkan.
   - **Setujui** (tanda tangan canvas atau QR) → langkah 1 hijau atas nama Yoga Putra S.
6. **Login `muslih`:** setujui → langkah 2 hijau; status masih "Diajukan" tanpa nomor.
7. **Login `ceo`:** SPJ muncul dengan "Menunggu Anda" → setujui.
   - Status "Disetujui", nomor terbit (mis. `004/SPJ-PD/LDP-HC/XI/2026`, urutan global melanjutkan Surat Keluar).
   - Rekening peserta tersamar untuk ceo.
8. **Opsional — alur tolak:** ajukan SPJ kedua, tolak sebagai yoga dengan alasan. Sebagai staff.cre1 alasan
   tampil → "Revisi & Ajukan Ulang" → timeline kembali 3 langkah "Menunggu".

---

## 4. Rincian bagian berikutnya (urutan: B5 → B8a → B6 → B7 → B8b → B9)

### B5 — DinasLuarService (Dinas Luar otomatis untuk semua peserta) — ✅ selesai
- Implementasi: `app/Services/Spj/DinasLuarService.php` — `karyawanIdsAktifPada($tanggal, ?$karyawanId)` dan
  `sedangDinasLuar($karyawanId, $tanggal)`; batas tanggal inklusif; hasil unik (karyawan di SPJ lama & baru dihitung sekali).

Rencana awal:
- Buat `App\Services\Spj\DinasLuarService::karyawanIdsAktifPada($tanggal): array` yang menggabungkan:
  - SPJ lama: `PengajuanSpj::aktifPada($tanggal)->pluck('karyawan_id')` (status `Menunggu Pelaporan`,
    `Menunggu Validasi Finance`, `Selesai`).
  - SPJ baru: `spj_pesertas.karyawan_id` dari `spjs` berstatus **Disetujui** atau **Selesai** dengan
    `tgl_berangkat <= tanggal <= tgl_pulang`.
- Ganti 3 pemakaian `PengajuanSpj::aktifPada`:
  1. `AbsensiController@index` (monitor HC, status "Dinas Luar").
  2. `AbsensiController@store` (bypass radius geofence, status `Dinas Luar`, catatan "Bypass Radius: SPJ Aktif").
  3. `RunDailyAutomation::generateAlpha` (Dinas Luar otomatis, catatan "Otomatis: SPJ aktif, tanpa presensi").
- `AbsensiSpjTest` lama harus tetap lolos. Test baru: semua peserta SPJ baru yang disetujui → Dinas Luar
  otomatis & bypass radius; SPJ Draft/Diajukan/Ditolak tidak.

### B6 — Nota & reimburse, catatan selisih, dashboard, rekap — ✅ selesai
Keputusan implementasi:
- Unggah nota: SPJ **Disetujui** saja; oleh pengaju (untuk peserta mana pun), koordinator (`koordinator_karyawan_id`,
  belum ada UI pengisiannya), atau peserta (hanya untuk dirinya). HC/Finance/Admin tidak mengunggah.
- Validasi & tolak nota: **hanya Finance (role 4)** — Admin juga tidak (`ReimburseSpjService::ROLE_VALIDASI`).
- Nota penginapan wajib `jumlah_malam` (1..malam perjalanan) agar nota per malam bisa dibandingkan dengan tarif.
- Tanggal nota harus dalam rentang perjalanan. Berkas (PDF/JPG/PNG ≤ 5 MB) di disk privat `local`
  (`storage/app/private/spj/nota/{spj_id}`), dibuka lewat `spj.nota.berkas` (hanya yang berhak melihat SPJ).
- Nota Menunggu boleh dihapus pengunggah/pengaju; nota tervalidasi/ditolak final (ditolak → unggah nota pengganti).
- Selisih sama persis dengan tarif tidak dicatat; persen = (nota/malam − tarif)/tarif × 100.
- Total di halaman detail & PDF = uang harian + reimburse tervalidasi.
- Rekap & panel: Admin, HC, Finance (`RekapSelisihSpjService::ROLE_LIHAT`); Direktur tidak. Menu "Rekap Selisih SPJ"
  (Master Data, order 10) lewat migrasi data `2026_11_24_100200` + `MenuSeeder`.

Rencana awal:
- Tabel `spj_biayas`: `spj_peserta_id`, jenis (`penginapan`/`tiket`/`transport`/`lainnya`), tanggal,
  keterangan, `nominal_nota`, `file_nota_path`, status (Menunggu/Divalidasi/Ditolak), `nominal_dibayar`,
  `divalidasi_oleh`, `divalidasi_pada`, catatan.
- Unggah nota per peserta per jenis biaya (setelah SPJ Disetujui; oleh peserta/pengaju/koordinator).
  Finance memvalidasi.
- **Penginapan:** batas = `spj_pesertas.batas_penginapan` (tarif × malam) untuk **total** nota penginapan per
  peserta. Saat validasi: `dibayar = min(nota, sisa batas)`; kelebihan tidak dibayar (ditanggung peserta).
  Provinsi tanpa tarif penginapan: validasi manual Finance, tanpa catatan selisih.
- Tiket/transport/lainnya: dibayar sesuai nota yang divalidasi.
- Tabel `spj_selisih_penginapans`: dicatat otomatis saat nota penginapan divalidasi — provinsi, kategori,
  nota per malam, tarif per malam, selisih, persen, tingkat (`peringatan` bila nota > tarif, `info` bila
  lebih murah).
- Panel di dashboard HC & Finance (`DashboardController::dataEksekutif`, role 1/3/4) dan halaman rekap per
  provinsi (`spj.rekap-selisih`): rata-rata nota vs tarif, jumlah kejadian, persentase selisih.
- Test: min(nota, batas); kelebihan tidak dibayar; batas per total peserta; selisih tercatat (peringatan/info).

### B7 — Pembayaran & bukti transfer — ✅ selesai
Keputusan implementasi:
- Hanya **Finance (role 4)** mencatat & membatalkan pembayaran (Admin juga tidak), hanya saat SPJ **Disetujui**.
- Per peserta, dua jenis: `uang_harian` (total dicatat ≤ `spj_pesertas.total_uang_harian`) dan `reimburse`
  (total dicatat ≤ jumlah `nominal_dibayar` nota **Divalidasi** milik peserta itu). Boleh dicicil; status per jenis:
  Belum dibayar / Sebagian / Lunas / Tidak ada (hak 0). Nota Menunggu & milik peserta lain tidak menambah hak.
- Tanggal transfer ≤ hari ini; bukti wajib (PDF/JPG/PNG ≤ 5 MB) di disk privat `local`
  (`storage/app/private/spj/bukti-transfer/{spj_id}`); bila pencatatan gagal, berkas yang sudah tersimpan dihapus.
- Rekening tujuan disimpan sebagai snapshot terenkripsi (`spj_pembayarans.rekening_encrypted`), tampil via `RekeningSpj`
  (lengkap untuk Admin/HC/Finance & pemilik). Peserta tanpa rekening tidak bisa dibayar.
- Bukti transfer hanya untuk Admin/HC/Finance dan peserta penerima (pengaju lain & Direktur 403).
- Pembatalan pencatatan yang keliru: Finance, alasan wajib. **Hanya penandaan** (`dibatalkan_pada`, `dibatalkan_oleh`,
  `alasan_batal`; migrasi `2026_11_25_100100`): baris & bukti transfer TETAP disimpan, tampil dicoret berlabel
  "Dibatalkan" di riwayat, bukti tetap bisa dibuka yang berhak, dan tidak dihitung ke total dibayar (scope `aktif()`).
  Berkas dari pencatatan yang gagal validasi aturan tetap dihapus. Tercatat di AuditTrail (`data_lama` + alasan).
  Catat & batal → AuditTrail modul "SPJ Perjalanan Dinas".
- Untuk B9: `PembayaranSpjService::uangHarianLunasSemua($spj)` (hak 0 dianggap tuntas).

Rencana awal:
- Tabel `spj_pembayarans`: `spj_peserta_id`, jenis (`uang_harian`/`reimburse`), nominal, `tanggal_transfer`,
  `bukti_transfer_path`, `dicatat_oleh`, catatan.
- Finance mencatat pembayaran uang harian per peserta (nominal = `total_uang_harian`) dan reimburse (total
  nota tervalidasi) dengan unggah bukti transfer. Tab "Pembayaran" di halaman detail.
- Rekening: lengkap untuk HC/Finance/Admin & pemilik; lainnya disamarkan (`RekeningSpj`).
- Test: rekening tersembunyi untuk yang tidak berhak; hanya Finance yang mencatat pembayaran.

### B8 — dipecah: **B8a** PDF SPJ (dimajukan sebelum B6) dan **B8b** Risalah + PDF Risalah (setelah B7)
- B8a: PDF SPJ + tombol "Cetak PDF" di halaman detail, **hanya untuk SPJ yang sudah bernomor**. Bagian
  AKOMODASI kosong saat terbit (terisi nanti dari reimburse B6). Render contoh SPJ 004 untuk dicek visual.
- **Data uji SPJ 004:** `004/SPJ-PD/LDP-HC/XI/2026`, Jawa Timur, **27–29 November 2026**, peserta fahla & Staff Creative 1.
- B8b: tabel risalah + PDF Risalah (rincian di bawah) — ✅ selesai. Keputusan implementasi:
  - Koordinator: dropdown opsional di form (dikosongkan otomatis bila pesertanya dihapus), validasi `Rule::in(peserta)`;
    di detail diubah lewat `spj.koordinator` oleh **pengaju atau HC (role 3)** selama status bukan Selesai/Dibatalkan
    (Admin tidak). **Bug diperbaiki:** `ajukanSpj()` menyimpan ulang tanpa koordinator sehingga koordinator selalu
    ter-reset saat diajukan — kini ikut disimpan (test `test_koordinator_tetap_tersimpan_saat_diajukan_dan_diajukan_ulang`).
  - Risalah boleh diisi bila SPJ **Disetujui** dan hari ini ≥ tanggal berangkat, oleh koordinator atau pengaju
    (bisa diubah berulang). Kepala: Topik, Tempat, Waktu (teks bebas) wajib; minimal satu kegiatan di salah satu tanggal.
    Satu blok per tanggal perjalanan (kegiatan bernomor, baris kosong dibuang). "Terisi" = `SpjRisalah::terisi()`
    (dipakai tombol Cetak & syarat B9).
  - Lampiran: JPG/PNG ≤ 5 MB, maks 10 per tanggal, disk privat `storage/app/private/spj/risalah/{spj_id}`; dibuka lewat
    `spj.risalah.lampiran.lihat` (yang berhak melihat SPJ). **Foto PNG & JPEG dengan sisi terpanjang > 1600 px
    diperkecil saat unggah** dan orientasi EXIF foto ponsel diluruskan (`RisalahSpjService::simpanGambar`). JPEG butuh
    GD `--with-jpeg` (Dockerfile sejak commit B8b; **perlu rebuild image**); tanpa itu JPEG disimpan apa adanya
    (DomPDF menyematkan JPEG tanpa decode). Ukuran tampil di PDF dihitung dari dimensi berkas agar muat 16 × 10,5 cm.
  - Lingkungan (commit B8b): Dockerfile `libjpeg-dev`, `libfreetype6-dev`, `docker-php-ext-configure gd --with-jpeg
    --with-freetype`; `docker/php/ldp.ini` → `memory_limit=256M`, `upload_max_filesize=6M`, `post_max_size=64M`;
    nginx `client_max_body_size 64m` (sebelumnya bawaan 1m/2M menolak unggahan > 1–2 MB sebelum validasi 5 MB).
    Rebuild (service nginx bernama `webserver`):
    `docker compose build app`, lalu `docker compose up -d app`, lalu `docker compose restart webserver`.
    Build butuh `.dockerignore` (tanpa itu konteks build ikut membawa `storage/app/private/spj` milik `www-data`
    berizin 700 → "permission denied", serta `.env`/`*.sql` ikut masuk image).
  - PDF risalah: tabel kepala 3 kolom (logo | RISALAH PERJALANAN DINAS | PT. LINTAS DATA PRIMA), Date/Time
    ("tgl – tgl / waktu"), Place, Topics, Attendance (peserta bernomor + posisi); Detail Perjalanan di luar tabel
    agar bisa berlanjut ke halaman berikut; tanda tangan kanan bawah: "Koordinator Perjalanan Dinas" (atau "Pengaju"
    bila tanpa koordinator), nama bergaris bawah + `nama_posisi` (fallback jenjang jabatan), ruang TTD basah.
  - Contoh: `storage/app/contoh-pdf/Risalah_SPJ_004_DATA_UJI.pdf` (dirender dalam transaksi yang di-rollback; DB bersih).
  - **Tambahan B8b: pemilihan koordinator** (`spjs.koordinator_karyawan_id`) di form SPJ (dropdown dari peserta,
    opsional) dan di halaman detail (pengaju dapat mengganti selama SPJ belum Selesai). Koordinator mengisi risalah
    dan boleh mengunggah nota untuk semua peserta (`ReimburseSpjService::bolehUnggah` sudah memakai kolom ini);
    bila kosong, pengaju yang mengisi risalah.
- Catatan teknis B8a (DomPDF 3.1):
  - Kepala tabel hanya berulang bila tabel terbelah **di antara row group**, jadi tiap baris dibungkus
    `<tbody>` sendiri dan `thead` tanpa `rowspan`. Terverifikasi: 8–14 peserta → kepala tabel muncul lagi di puncak hal. 2.
  - Subtotal, TOTAL, dan Terbilang dihitung di view dari baris yang ditampilkan (`SpjPdfService::ringkasan`),
    bukan dari `spjs.total_uang_harian`. Test: 10 peserta → Rp 4.920.000 / "Empat Juta Sembilan Ratus Dua Puluh Ribu Rupiah".
  - Kolom TGL 20% (`white-space: nowrap`), PERINCIAN 24%.
  - Kota dirapikan saat SPJ disimpan: `ucwords` + spasi tunggal ("malang" → "Malang"; "DKI" tetap). Data lama tidak diubah;
    PDF & halaman verifikasi tetap menampilkan huruf kapital awal.
  - Cek visual: `pdftoppm` (poppler-utils) ada di Dockerfile `ldp_app` (sejak commit B6; perlu rebuild image:
    `docker compose build app`, `docker compose up -d app`, `docker compose restart webserver`). Contoh: `docker exec ldp_app pdftoppm -r 80 -png <file.pdf> <prefix>`.
  - Keterbatasan (DITERIMA pemilik): bila daftar Nama/Jabatan sangat panjang (±20+ peserta) sehingga tabel mulai tepat di dasar
    halaman 1, DomPDF memecah tepat setelah `thead` dan kepala tidak diulang. Tidak terjadi pada jumlah peserta wajar.
  - SPJ 004 (2 peserta) muat 1 halaman termasuk tanda tangan; QR verifikasi di kanan Terbilang (bila semua
    penanda tangan memakai gambar TTD), atau di kolom TTD (bila ada yang memilih QR).
  - AKOMODASI: `SpjPdfService::data()` mengisi `$akomodasi = []`; B6 tinggal mengisinya dari nota tervalidasi
    (kunci baris: perincian, tgl, harian, total, ket).

Rincian:
- Tabel `spj_risalahs` (topik, tempat, diisi_oleh, koordinator) + `spj_risalah_details` (per tanggal, uraian) +
  `spj_risalah_lampirans` (rundown/foto). Diisi SETELAH perjalanan oleh koordinator (atau pengaju).
- **PDF SPJ** (`resources/views/pdf/spj.blade.php`) meniru dokumen perusahaan 047/SPJ-PD/LDP-HC/VIII/2026:
  - Wajib memakai partial yang ada: `@include('pdf.partials._gaya', ['pakaiLatar' => …])` (memuat `_fonts`,
    Carlito), `_latar` (latar kop A4 penuh, margin 3/1,8/6,5/2,5 cm), `_tanda_tangan`, dan
    `PdfGambarService` untuk gambar.
  - Judul "SPJ BIAYA PERJALANAN DINAS" bergaris bawah di tengah, "Nomor : …" tebal di bawahnya.
  - Kalimat "Sesuai dengan Risalah Perjalanan Dinas tanggal …" (hanya bila `tanggal_risalah_awal` terisi).
  - Blok Nama / Jabatan (semua peserta, satu baris per orang, jabatan = `posisi` snapshot), Department
    (gabungan unik departemen peserta, dipisah koma), Tujuan, Keperluan, Tanggal (hari, tanggal - tanggal,
    jumlah hari).
  - Tabel NO | PERINCIAN BIAYA | TGL | JUMLAH (Harian, Total) | KET; KET = "Transfer // <rekening> (<nama>)";
    bagian UANG HARIAN dan AKOMODASI dengan subtotal, TOTAL, Terbilang, catatan "Akomodasi dan lainnya
    menggunakan sistem reimburse". `thead` dengan `display: table-header-group` agar kepala tabel berulang
    di halaman 2; tabel harus muat di area isi dan berlanjut rapi.
  - Tempat & tanggal (`kota_surat` layout), tiga kolom tanda tangan Diajukan Oleh / Diperiksa Oleh /
    Disetujui Oleh (nama bergaris bawah + jabatan) dari **approver asli** (`spj_approvals.user_id_aktual`),
    QR verifikasi seperti surat keluar. Admin tidak menandatangani.
  - Rekening di PDF mengikuti `RekeningSpj` (sesuai pengunduh).
- **PDF Risalah** (`pdf/spj_risalah.blade.php`): tabel kepala berisi logo, judul "RISALAH PERJALANAN DINAS",
  Date/Time, Place, Topics, Attendance (daftar peserta), Detail Perjalanan per tanggal (teks + gambar
  rundown), tanda tangan koordinator. Latar kop A4 yang sama.
- Semua data diisi otomatis dari data SPJ; **tidak boleh ada placeholder** seperti `[Nama]`.
- Render PDF contoh (Jawa Timur, 3 peserta) & PDF Risalah lalu laporkan lokasinya untuk dicek visual.
- Test: render tanpa error & tanpa placeholder; dua PDF berturut-turut aman.

### B9 — Penutupan & pensiun SPJ lama — ✅ selesai
Keputusan implementasi (pemilik memilih opsi pembatalan pada 2026-11-20):
- **Tandai Selesai**: hanya **Finance (role 4)**, SPJ Disetujui, syarat (`PenutupanSpjService::syaratBelumTerpenuhi`):
  uang harian semua peserta Lunas (hak 0 = tuntas), tidak ada nota Menunggu, reimburse semua peserta Lunas sesuai total
  nota tervalidasi, risalah terisi. Bila belum, tombol nonaktif + daftar syarat yang belum terpenuhi. Tercatat
  `diselesaikan_pada/oleh` + AuditTrail. Setelah Selesai, nota/pembayaran/risalah/koordinator terkunci (semua aksi itu
  mensyaratkan status Disetujui; koordinator dikecualikan untuk Selesai/Dibatalkan). Peserta tetap dihitung Dinas Luar.
- **Pembatalan** (status `Dibatalkan`; sebelumnya status ini hanya konstanta tanpa jalur transisi):
  - Draft: **dihapus permanen** (tidak dibatalkan); tombol Hapus hanya untuk Draft (Ditolak tidak lagi bisa dihapus).
  - Diajukan / Ditolak: hanya **pengaju**, alasan opsional; langkah persetujuan tersisa tidak bisa diproses lagi.
  - Disetujui: hanya **HC (role 3)**, alasan wajib, dan hanya bila **tidak ada pembayaran aktif** (pembayaran yang
    sudah dibatalkan dan nota — menunggu/tervalidasi — tidak menghalangi; semuanya tetap tersimpan sebagai riwayat).
  - Selesai/Dibatalkan tidak bisa dibatalkan. Tercatat `dibatalkan_pada/oleh`, `alasan_batal` + AuditTrail.
  - Nomor surat tetap di `spjs.nomor_surat` & `nomor_surat_terbits`; penghitung hanya naik (tidak dipakai ulang).
    PDF SPJ yang dibatalkan memuat tanda "DIBATALKAN". SPJ Dibatalkan tidak dihitung Dinas Luar.
- **SPJ lama**: `spj.lama.create` & `spj.lama.store` mengalihkan ke `spj.create` dengan pesan; halaman `Spj/Create.jsx`
  dihapus; `/spj` tetap bisa dibaca (arsip + pelaporan). Bug `PengajuanSpj::$fillable` tanpa `laporan_hasil` diperbaiki.
- **Menu**: route baru `spj.menunggu` (`/perjalanan-dinas/menunggu-saya`, daftar SPJ dengan filter "Menunggu Anda";
  filter juga tersedia sebagai tombol di daftar, `?menunggu=1`). Migrasi data `2026_11_27_100100` menambah menu
  "Approval SPJ" → `spj.menunggu` di Approval Center untuk role yang punya menu lama (+Admin), dan mengganti nama menu lama
  `admin.spj.index` menjadi "Arsip Approval SPJ (Lama)" (order 9). `menus`/`role_has_menus` tanpa indeks unik → cek
  keberadaan dulu + `insertOrIgnore`. `MenuSeeder` diperbarui. Sidebar `AdminLayout` "Apprv SPJ" → `spj.menunggu`.
- **Dashboard**: Supervisor menampilkan **SPJ baru yang menunggu tindakannya** (mis. lewat Delegasi; rute SPJ tidak
  melibatkan Supervisor, dan SPJ bawahan tidak boleh ia buka); pintasan eksekutif Direktur/Finance → `spj.menunggu`.

Rencana awal:
- Tombol "Tandai Selesai" (Finance) hanya aktif bila: uang harian semua peserta sudah dicatat dibayar, semua
  nota sudah divalidasi, risalah sudah terisi. Test syarat ini.
- Pensiunkan SPJ lama: hentikan pembuatan SPJ lama (hapus/arsipkan `spj.lama.create/store`), label menu
  `admin.spj.index` → "Approval SPJ (Lama)" atau arsip, sesuaikan dashboard Supervisor (`pendingSpj`) dan
  pintasan `admin.spj.index` di dashboard eksekutif agar tidak ada tautan mati.
- Perbaiki bug `PengajuanSpj::$fillable` yang tidak memuat `laporan_hasil` (laporan lama tidak tersimpan).
- Menu **"Approval SPJ" di Approval Center** diarahkan ke daftar SPJ baru (`spj.index`) dengan filter
  **"Menunggu Anda"** (bukan lagi `admin.spj.index` model lama).
- Ringkasan akhir: provinsi yang belum punya tarif (lihat §7).

**Ringkasan akhir tarif (dari DB, 2026-11-20):** 17 provinsi punya tarif uang harian **dan** penginapan (Aceh, Bali,
Bangka Belitung, Banten, Bengkulu, DI Yogyakarta, DKI Jakarta, Jambi, Jawa Barat, Jawa Tengah, Jawa Timur, Kepulauan Riau,
Lampung, Riau, Sumatera Barat, Sumatera Selatan, Sumatera Utara). **NTB & NTT** hanya punya tarif penginapan, jadi belum
bisa dipilih di form SPJ (dropdown hanya provinsi bertarif uang harian). Belum ada tarif sama sekali: seluruh Kalimantan,
Sulawesi, Gorontalo, Maluku, Maluku Utara, Papua dan pemekarannya.

---

## 5. Peta file modul SPJ

**Model**
- `app/Models/Spj.php` — header SPJ, status, scope `terlihatOleh`, `langkahAktif()`, `bisaDiubahOleh()`
- `app/Models/SpjPeserta.php` — peserta + snapshot (rekening terenkripsi, `$hidden`)
- `app/Models/SpjApproval.php` — langkah persetujuan
- `app/Models/SpjBiaya.php` — nota reimburse per peserta; `app/Models/SpjSelisihPenginapan.php`
- `app/Models/SpjRisalah.php` (`terisi()`), `SpjRisalahDetail.php` (kegiatan JSON), `SpjRisalahLampiran.php`
- `app/Models/SpjPembayaran.php` — pembayaran per peserta (rekening snapshot di `$hidden`)
- `app/Models/MasterTarifSpj.php` — `tarifBerlaku()`, `provinsiUangHarian()`
- `app/Models/RuteApprovalTemplate.php` — tipe jabatan/role
- Terkait: `Karyawan` (`kategori_tarif_spj`, `nama_posisi`, `no_rek_bca_encrypted`), `DelegasiWewenang`,
  `UnitPenerbitSurat`, `NomorSuratTerbit`; SPJ lama: `PengajuanSpj`, `KomponenBiayaSpj`

**Service / Support**
- `app/Services/Spj/SpjKalkulator.php` — satu sumber perhitungan (form, simpan, PDF)
- `app/Services/Spj/ReimburseSpjService.php` — aturan nota: hak unggah/validasi, min(nota, sisa batas), selisih, baris AKOMODASI PDF
- `app/Services/Spj/PenutupanSpjService.php` — syarat Selesai, selesaikan, aturan & proses pembatalan
- `app/Services/Spj/RisalahSpjService.php` — koordinator, hak isi risalah, simpan, lampiran (perkecil PNG), data & PDF risalah
- `app/Services/Spj/PembayaranSpjService.php` — hak/terbayar per peserta, batas nominal, bukti & status pembayaran
- `app/Services/Spj/RekapSelisihSpjService.php` — rekap per provinsi, rincian kejadian, panel dashboard
- `app/Services/Spj/SpjPdfService.php` — data & render PDF SPJ (rekening via `RekeningSpj`, TTD approver asli, QR)
- `app/Services/Spj/DinasLuarService.php` — karyawan sedang Dinas Luar (SPJ lama + baru); dipakai
  `AbsensiController@index/store` dan `RunDailyAutomation::generateAlpha`
- `app/Services/Spj/OtorisasiApprovalSpj.php` — aturan siapa boleh menyetujui
- `app/Services/Spj/RekeningSpj.php` — tampil lengkap/disamarkan
- `app/Support/Terbilang.php`
- `app/Services/PenomoranSuratService.php`, `app/Services/PdfGambarService.php` (persuratan)

**Controller**
- `app/Http/Controllers/Spj/SpjController.php` — index, create, store, show, edit, update, destroy, ajukan, hitung
- `app/Http/Controllers/Spj/SpjPersetujuanController.php` — approve, tolak
- `app/Http/Controllers/Spj/SpjBiayaController.php` — nota: store, destroy, berkas, validasi, tolak
- `app/Http/Controllers/Spj/SpjPenutupanController.php` — selesai, batal
- `app/Http/Controllers/Spj/SpjRisalahController.php` — koordinator, risalah edit/update, lampiran store/lihat/destroy, pdf
- `app/Http/Controllers/Spj/SpjPembayaranController.php` — pembayaran: store, destroy (batal + alasan), bukti
- `SpjController@rekapSelisih`; `DashboardController::dataEksekutif` → prop `spjReimburse`
- `app/Http/Controllers/MasterData/MasterTarifSpjController.php` — tarif + kategori karyawan
- SPJ lama: `app/Http/Controllers/PengajuanSpjController.php`

**Route** (`routes/web.php`)
- `spj.*` di prefix `/perjalanan-dinas`: index, create (`/buat`), store, hitung, edit (`/{spj}/ubah`), update,
  destroy, ajukan, show, pdf (`/{spj}/pdf`), approve (`/{spj}/setujui`), tolak
- Nota (B6): `spj.nota.store` (`/{spj}/nota`), `spj.nota.berkas`, `spj.nota.validasi`, `spj.nota.tolak`, `spj.nota.destroy`
  (`/nota/{biaya}/…`); pembayaran (B7): `spj.pembayaran.store` (`/{spj}/pembayaran`), `spj.pembayaran.bukti`,
  `spj.pembayaran.destroy` (`/pembayaran/{pembayaran}/…`); B8b: `spj.koordinator` (PUT `/{spj}/koordinator`),
  `spj.risalah.edit|update|pdf` (`/{spj}/risalah…`), `spj.risalah.lampiran.store` (`/{spj}/risalah/lampiran`),
  `spj.risalah.lampiran.lihat|destroy` (`/risalah/lampiran/{lampiran}`); `spj.rekap-selisih` (`/rekap-selisih`, didaftarkan sebelum `/{spj}`)
- B9: `spj.menunggu` (`/menunggu-saya`), `spj.selesai` (POST `/{spj}/selesai`), `spj.batal` (POST `/{spj}/batalkan`)
- Publik (tanpa login): `verifikasi.spj` (`/verifikasi/spj/{token}`) dari QR PDF SPJ
- `tarif-spj.*` di `/master-data/tarif-spj` (+ `tarif-spj.kategori`)
- SPJ lama: `spj.lama.*` (`/spj`), `admin.spj.*`

**Halaman (React/Inertia)**
- `resources/js/Pages/PerjalananDinas/Index.jsx`, `Form.jsx`, `Show.jsx`, `Verifikasi.jsx` (publik, dari QR),
  `RekapSelisih.jsx`, `Partials/NotaReimburse.jsx`, `Partials/PembayaranSpj.jsx`, `Risalah.jsx`; panel `PanelSpjReimburse` di `Pages/Dashboard.jsx`
- `resources/views/pdf/spj.blade.php`, `resources/views/pdf/spj_risalah.blade.php`
- `resources/js/Pages/MasterData/TarifSpj/Index.jsx`
- `resources/js/Utils/spj.js` (rentang tanggal, warna status)
- `resources/js/Components/SignModal.jsx` (prop `approveUrl`)
- SPJ lama: `resources/js/Pages/Spj/*`

**Migrasi (semua baru, urutan)**
- `2026_11_21_100000_create_master_tarif_spjs_table`
- `2026_11_21_100100_add_kategori_tarif_spj_to_karyawans_table`
- `2026_11_21_100200_isi_kategori_tarif_spj_awal` (data)
- `2026_11_21_100300_tambah_menu_master_tarif_spj` (data)
- `2026_11_21_100400_batalkan_spj_lama_data_uji` (data)
- `2026_11_21_100500_add_tipe_penyetuju_to_rute_approval_templates_table`
- `2026_11_21_100600_isi_rute_approval_spj_pd` (data)
- `2026_11_22_100000_add_nama_posisi_to_karyawans_table`
- `2026_11_22_100100_isi_nama_posisi_struktur_ldp` (data)
- `2026_11_22_100200_isi_rekening_dummy_uji_spj` (data UJI — ganti dengan rekening asli)
- `2026_11_22_100300_create_spjs_table`
- `2026_11_22_100400_create_spj_pesertas_table`
- `2026_11_23_100000_create_spj_approvals_table`
- `2026_11_23_100100_buat_langkah_approval_spj_diajukan` (data, pengaman)
- `2026_11_24_100000_create_spj_biayas_table`
- `2026_11_24_100100_create_spj_selisih_penginapans_table`
- `2026_11_24_100200_tambah_menu_rekap_selisih_spj` (data)
- `2026_11_25_100000_create_spj_pembayarans_table`
- `2026_11_25_100100_add_pembatalan_to_spj_pembayarans_table`
- `2026_11_26_100000_create_spj_risalahs_table` (risalahs + details + lampirans)
- `2026_11_27_100000_add_penutupan_to_spjs_table`
- `2026_11_27_100100_alihkan_menu_approval_spj_ke_spj_baru` (data)

**Seeder**
- `MasterTarifSpjSeeder` (dipanggil `DatabaseSeeder`), `MasterTemplateSuratSeeder` (rute SPJ-PD untuk
  instalasi baru), `LdpStrukturSeeder` (`nama_posisi` & kategori tarif awal karyawan baru, tanpa menimpa),
  `MenuSeeder` (menu Master Tarif SPJ untuk instalasi baru)
- **Perhatian:** `MenuSeeder` meng-*truncate* menu & `role_has_menus` → jangan dijalankan di DB yang hak
  aksesnya sudah diatur lewat UI; tambah menu baru lewat migrasi data.

**Test** (`tests/Feature/Spj/`)
- `SpjTestCase.php` (basis; mewarisi `tests/Feature/Persuratan/PersuratanTestCase.php`)
- `MasterTarifSpjTest`, `SpjLamaDibatalkanTest`, `RuteApprovalSpjTest`, `DataKaryawanSpjTest`,
  `PengajuanSpjTest`, `PersetujuanSpjTest`, `DinasLuarSpjTest` (basis `KeuanganTestCase`, fixture geofence), `PdfSpjTest`, `ReimburseSpjTest`, `PembayaranSpjTest`, `RisalahSpjTest`, `PenutupanSpjTest`

**Akun uji** (password semua `password123`)
| Username | Peran | Catatan |
|---|---|---|
| `staff.cre1` | Karyawan (role 6), CRE | Pengaju & peserta uji; rekening dummy `9990000002` |
| `fahla` | Supervisor (role 5), jenjang MGR | Peserta; kategori **Staff** (Head of Artistic); rekening dummy `9990000001` |
| `yoga` | HC (role 3), Manager HC | Penyetuju langkah 1 |
| `muslih` | Finance (role 4), Manager Finance | Penyetuju langkah 2 |
| `ceo` | Direktur (role 2), jabatan CEO | Penyetuju langkah 3 |
| `syahrul.admin` | Admin (role 1) | Melihat semua, **tidak** bisa menyetujui |

Kategori tarif awal: Direksi = ceo, md; Manager = yoga, muslih, yanis, nanang, ridwan, sulistyanto;
Staff = semua lainnya (termasuk fahla, mikha, elvira, anas).

---

## 6. Aturan kerja (wajib)
- **Backup DB sebelum migrate**:
  `docker exec ldp_mysql mysqldump -u<user> -p<pass> ldp_hris_payroll > backup_sebelum_<nama>.sql`
  (kredensial dari `.env`; jangan tampilkan password; contoh aman:
  `docker exec -e MYSQL_PWD="$DB_PASSWORD" ldp_mysql mysqldump -u"$DB_USERNAME" --single-transaction ldp_hris_payroll > backup_….sql`).
- **Hanya migrasi baru**; jangan mengedit migrasi lama yang sudah dijalankan/di-commit.
- **Jangan `php artisan db:seed` tanpa `--class`.** Seeder harus idempoten dan tidak menimpa data yang sudah
  diubah HC (pakai `firstOrCreate`/cek kosong).
- Artisan yang menyentuh DB dijalankan di container: `docker exec ldp_app php artisan …`.
- **Test** memakai sqlite `:memory:` (phpunit.xml): `docker exec ldp_app php artisan test`.
- **Build**: `docker exec ldp_vite npm run build` (bila gagal karena izin `public/build`, tanya dulu; jangan sudo).
- Kerjakan **satu bagian** lalu **BERHENTI** dengan ringkasan & langkah uji manual; tunggu persetujuan.
- **Jangan commit/push tanpa izin** ("commit" eksplisit dari pemilik). Jangan push sama sekali kecuali diminta.
- `.sql`, `.env`, `storage/app/kop/`, cache `storage/fonts/`, dan `*:Zone.Identifier` **tidak boleh ikut commit**
  (sudah di `.gitignore`; tetap cek `git diff --cached --name-only` sebelum commit).
- Pesan commit, komentar kode, teks UI, dan flash message dalam Bahasa Indonesia.
- Setiap route baru wajib bernama dan tercakup menu (prefix) agar non-admin tidak 403.
- Setelah mengubah skema: `docker exec ldp_app php artisan ai:snapshot` (memperbarui `AI_CONTEXT.md`).

---

## 7. Pertanyaan terbuka untuk perusahaan
1. **Urutan nomor surat**: tetap satu urutan global per tahun, atau per jenis surat / per penerbit?
   (Pengaturan `penomoran_surat_mode`: `global` | `per_jenis` | `per_penerbit`; sekarang `global`.)
2. **Tabel tarif provinsi belum lengkap**: NTB & NTT baru punya tarif penginapan (belum uang harian);
   belum ada sama sekali: Kalimantan (Barat, Tengah, Selatan, Timur, Utara), Sulawesi (Utara, Tengah,
   Selatan, Tenggara, Barat), Gorontalo, Maluku, Maluku Utara, Papua dan provinsi pemekarannya.
3. **Tanggal berlaku tarif**: seed memakai 2026-01-01 — perlu tanggal resmi.
4. **Batas 60 hari** per perjalanan — apakah sesuai kebijakan?
5. **Siapa yang menyetujui perjalanan Direksi** (mis. CEO ikut sebagai peserta, sedangkan langkah 3 adalah
   jabatan CEO): siapa yang menerima Delegasi Wewenang, atau perlu rute khusus?
6. **Alamat dan aset kop resmi**: alamat layout sekarang "Darmo Residence No. 1, Sonopakis Kidul, Kasihan,
   Bantul - Yogyakarta"; gambar latar kop A4 dari `resources/kop/kop_latar_ldp_a4.jpg` — perlu versi resmi
   (disarankan 2480×3508 px) dan konfirmasi alamat.
7. Rekening uji fahla & staff.cre1 adalah **dummy** (`999…`) — perlu rekening asli sebelum transfer sungguhan.

---

## 8. Rencana dokumen setelah SPJ selesai
1. **Alur proses bisnis SPJ** (diagram & narasi): pengajuan → persetujuan HC/Finance/Direktur → nomor & PDF → perjalanan
   (Dinas Luar otomatis) → risalah → nota & reimburse → pembayaran → Selesai.
2. **Penjelasan untuk perusahaan**: aturan tarif, kategori, batas penginapan, rekening, delegasi, cara membaca
   PDF, peran tiap akun.
3. **Bahan SRS SPJ**: kebutuhan fungsional & non-fungsional, aktor, use case, aturan bisnis (dari §2),
   skema data (dari §5), kriteria penerimaan (dari test di `tests/Feature/Spj/`).
