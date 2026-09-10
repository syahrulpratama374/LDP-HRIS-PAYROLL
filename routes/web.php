<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\{
    ProfileController, DashboardController, AbsensiController, 
    PengajuanCutiController, PengajuanLemburController, PinjamanController, 
    PengajuanSpjController, PayrollController, ItTicketController, 
    SuratPeringatanController, PenilaianKinerjaController, DelegasiWewenangController,
    JabatanController, GolonganController
};
use App\Http\Controllers\MasterData\DepartemenController;

// 1. Redirect Utama
Route::get('/', function () {
    return redirect()->route('login');
});

// 2. Rute Umum (Wajib Login - Berlaku untuk Semua Role 1-6)
Route::middleware(['auth'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Rute Profil
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // Terminal Absensi & Self-Service
    Route::get('/absensi/karyawan', [AbsensiController::class, 'create'])->name('absensi.create');
    Route::post('/absensi/karyawan', [AbsensiController::class, 'store'])->name('absensi.store');

    Route::get('/cuti', [PengajuanCutiController::class, 'index'])->name('cuti.index');
    Route::get('/cuti/ajukan', [PengajuanCutiController::class, 'create'])->name('cuti.create');
    Route::post('/cuti', [PengajuanCutiController::class, 'store'])->name('cuti.store');

    Route::get('/lembur', [App\Http\Controllers\PengajuanLemburController::class, 'index'])->name('lembur.index');
    Route::get('/lembur/ajukan', [App\Http\Controllers\PengajuanLemburController::class, 'create'])->name('lembur.create');
    Route::post('/lembur', [App\Http\Controllers\PengajuanLemburController::class, 'store'])->name('lembur.store');

    Route::get('/pinjaman', [PinjamanController::class, 'index'])->name('pinjaman.index');
    Route::get('/pinjaman/ajukan', [PinjamanController::class, 'create'])->name('pinjaman.create');
    Route::post('/pinjaman', [PinjamanController::class, 'store'])->name('pinjaman.store');

    Route::get('/spj', [PengajuanSpjController::class, 'index'])->name('spj.index');
    Route::get('/spj/ajukan', [PengajuanSpjController::class, 'create'])->name('spj.create');
    Route::post('/spj', [PengajuanSpjController::class, 'store'])->name('spj.store');
    Route::post('/spj/{id}/laporan', [PengajuanSpjController::class, 'storeLaporan'])->name('spj.laporan');

    Route::get('/slip-gaji', [PayrollController::class, 'myPayslips'])->name('slip.index');
    Route::get('/slip-gaji/{id}', [PayrollController::class, 'show'])->name('slip.show');
    Route::get('/slip-gaji/{id}/download', [PayrollController::class, 'downloadPdf'])->name('slip.download');

    Route::get('/it-ticket', [ItTicketController::class, 'index'])->name('ticket.index');
    Route::post('/it-ticket', [ItTicketController::class, 'store'])->name('ticket.store');
});


// 3. RUTE MANAJERIAL & OPERASIONAL (Dilindungi CheckRole)

// A. Akses SPV (5), HC (3), Admin (1) -> Modul Approval Kehadiran
Route::middleware(['auth', 'role:1,3,5'])->group(function () {
    Route::get('/admin/cuti', [PengajuanCutiController::class, 'adminIndex'])->name('admin.cuti.index');
    Route::patch('/admin/cuti/{id}/status', [PengajuanCutiController::class, 'updateStatus'])->name('admin.cuti.status');

    Route::get('/admin/delegasi', [DelegasiWewenangController::class, 'index'])->name('admin.delegasi.index');
    Route::post('/admin/delegasi', [DelegasiWewenangController::class, 'store'])->name('admin.delegasi.store');
    Route::patch('/admin/delegasi/{id}/status', [DelegasiWewenangController::class, 'updateStatus'])->name('admin.delegasi.status');
    Route::delete('/admin/delegasi/{id}', [DelegasiWewenangController::class, 'destroy'])->name('admin.delegasi.destroy');
    
    Route::get('/admin/lembur', [PengajuanLemburController::class, 'adminIndex'])->name('admin.lembur.index');
    Route::patch('/admin/lembur/{id}/status', [PengajuanLemburController::class, 'updateStatus'])->name('admin.lembur.status');
});

// B. Akses Finance (4) & Admin (1) -> Modul Keuangan & Payroll
Route::middleware(['auth', 'role:1,4'])->group(function () {
    Route::get('/admin/pinjaman', [PinjamanController::class, 'adminIndex'])->name('admin.pinjaman.index');
    Route::post('/admin/pinjaman/{id}/status', [PinjamanController::class, 'updateStatus'])->name('admin.pinjaman.update');

    Route::get('/admin/payroll', [PayrollController::class, 'index'])->name('admin.payroll.index');
    Route::post('/admin/payroll/generate', [PayrollController::class, 'generate'])->name('admin.payroll.generate');
    Route::post('/admin/payroll/{id}/finalize', [PayrollController::class, 'finalize'])->name('admin.payroll.finalize');
});

// C. Akses SPV (5), Finance (4), Direktur (2), Admin (1) -> Modul Multi-Tier Approval
Route::middleware(['auth', 'role:1,2,4,5'])->group(function () {
    Route::get('/admin/spj', [PengajuanSpjController::class, 'adminIndex'])->name('admin.spj.index');
    Route::post('/admin/spj/{id}/status', [PengajuanSpjController::class, 'updateStatus'])->name('admin.spj.update');
});

// D. Akses Khusus HC (3) & Admin (1) -> Master Data, Kepegawaian, Persuratan
Route::middleware(['auth', 'role:1,3'])->group(function () {
    Route::get('/absensi', [AbsensiController::class, 'index'])->name('absensi.index');
    
    // Master Data
    Route::prefix('master-data')->group(function () {
        Route::resource('departemen', DepartemenController::class)->except(['create', 'show', 'edit']);
        Route::resource('jabatan', JabatanController::class)->except(['create', 'show', 'edit']);
        Route::resource('golongan', GolonganController::class)->except(['create', 'show', 'edit']);

        // Master Cuti & Kalender Libur (HC & Admin)
    Route::get('/hc/master-cuti', [App\Http\Controllers\Kepegawaian\MasterCutiLiburController::class, 'index'])->name('hc.cuti.index');
    Route::post('/hc/master-cuti/default', [App\Http\Controllers\Kepegawaian\MasterCutiLiburController::class, 'updateDefaultCuti'])->name('hc.cuti.default');
    Route::post('/hc/master-cuti/libur', [App\Http\Controllers\Kepegawaian\MasterCutiLiburController::class, 'storeLibur'])->name('hc.libur.store');
    Route::delete('/hc/master-cuti/libur/{id}', [App\Http\Controllers\Kepegawaian\MasterCutiLiburController::class, 'destroyLibur'])->name('hc.libur.destroy');
    });

    // Kepegawaian & Disiplin
    Route::prefix('kepegawaian')->group(function () {
        Route::resource('karyawan', App\Http\Controllers\Kepegawaian\KaryawanController::class);
        Route::post('karyawan/{id}/gaji', [App\Http\Controllers\Kepegawaian\KaryawanController::class, 'updateGaji'])->name('karyawan.updateGaji');
        Route::post('karyawan/{id}/jabatan', [App\Http\Controllers\Kepegawaian\KaryawanController::class, 'updateJabatan'])->name('karyawan.updateJabatan');

        Route::get('/surat-peringatan', [SuratPeringatanController::class, 'index'])->name('admin.sp.index');
        Route::get('/surat-peringatan/buat', [SuratPeringatanController::class, 'create'])->name('admin.sp.create');
        Route::post('/surat-peringatan', [SuratPeringatanController::class, 'store'])->name('admin.sp.store');
        Route::delete('/surat-peringatan/{id}', [SuratPeringatanController::class, 'destroy'])->name('admin.sp.destroy');

        Route::get('/kinerja', [PenilaianKinerjaController::class, 'index'])->name('admin.kinerja.index');
        Route::get('/kinerja/buat', [PenilaianKinerjaController::class, 'create'])->name('admin.kinerja.create');
        Route::post('/kinerja', [PenilaianKinerjaController::class, 'store'])->name('admin.kinerja.store');
        Route::delete('/kinerja/{id}', [PenilaianKinerjaController::class, 'destroy'])->name('admin.kinerja.destroy');

        Route::get('/delegasi', [DelegasiWewenangController::class, 'index'])->name('admin.delegasi.index');
        Route::post('/delegasi', [DelegasiWewenangController::class, 'store'])->name('admin.delegasi.store');
        Route::post('/delegasi/{id}/status', [DelegasiWewenangController::class, 'updateStatus'])->name('admin.delegasi.status');
        Route::delete('/delegasi/{id}', [DelegasiWewenangController::class, 'destroy'])->name('admin.delegasi.destroy');
    });

    // Persuratan HC
    Route::prefix('persuratan')->group(function () {
        Route::resource('template', App\Http\Controllers\Persuratan\MasterTemplateController::class);
        Route::resource('keluar', App\Http\Controllers\Persuratan\SuratKeluarController::class);
        Route::post('keluar/{id}/terbitkan', [App\Http\Controllers\Persuratan\SuratKeluarController::class, 'terbitkan'])->name('keluar.terbitkan');
        Route::post('keluar/{id}/batal', [App\Http\Controllers\Persuratan\SuratKeluarController::class, 'batalkan'])->name('keluar.batalkan');
        Route::get('keluar/{id}/pdf', [App\Http\Controllers\Persuratan\SuratKeluarController::class, 'unduhPdf'])->name('keluar.pdf');
        Route::resource('masuk', App\Http\Controllers\Persuratan\SuratMasukController::class);
    });
});

// E. Akses Eksklusif Super Admin (1) -> Master IT
Route::middleware(['auth', 'role:1'])->group(function () {
    Route::get('/admin/it-ticket', [ItTicketController::class, 'adminIndex'])->name('admin.ticket.index');
    Route::post('/admin/it-ticket/{id}', [ItTicketController::class, 'update'])->name('admin.ticket.update');

    // BARU: Rute untuk Modul Dynamic Settings (Pengaturan Sistem Terpusat)
    Route::get('/admin/pengaturan', [App\Http\Controllers\PengaturanController::class, 'index'])->name('admin.pengaturan.index');
    Route::post('/admin/pengaturan', [App\Http\Controllers\PengaturanController::class, 'store'])->name('admin.pengaturan.store');
});

require __DIR__ . '/auth.php';