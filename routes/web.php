<?php

use App\Models\Karyawan;
use App\Models\PengajuanCuti;
use App\Models\PengajuanSpj;
use App\Models\ItTicket;

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\MasterData\DepartemenController;
use App\Http\Controllers\JabatanController;
use App\Http\Controllers\GolonganController;
use App\Http\Controllers\Kepegawaian\KaryawanController;
use App\Http\Controllers\AbsensiController;
use App\Http\Controllers\PengajuanCutiController;
use App\Http\Controllers\PengajuanLemburController;
use App\Http\Controllers\PinjamanController;
use App\Http\Controllers\PengajuanSpjController;
use App\Http\Controllers\PayrollController;
use App\Http\Controllers\ItTicketController;
use App\Http\Controllers\SuratPeringatanController;
use App\Http\Controllers\PenilaianKinerjaController;
use App\Http\Controllers\DelegasiWewenangController;
use App\Http\Controllers\DashboardController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// 1. Arahkan pengguna ke halaman Login saat mengakses domain utama
Route::get('/', function () {
    return redirect()->route('login');
});

// 2. Rute Umum (Wajib Login - Bisa diakses Admin & Karyawan)
Route::middleware(['auth'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
});
    // Rute Profil
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // Rute Absensi Karyawan (Terminal Kamera)
    Route::get('/absensi/karyawan', [AbsensiController::class, 'create'])->name('absensi.create');
    Route::post('/absensi/karyawan', [AbsensiController::class, 'store'])->name('absensi.store');

    // ==========================================
    // ROUTING PENGAJUAN CUTI & IZIN (KARYAWAN)
    // ==========================================
    Route::get('/cuti', [PengajuanCutiController::class, 'index'])->name('cuti.index');
    Route::get('/cuti/ajukan', [PengajuanCutiController::class, 'create'])->name('cuti.create');
    Route::post('/cuti', [PengajuanCutiController::class, 'store'])->name('cuti.store');

    Route::get('/lembur', [PengajuanLemburController::class, 'index'])->name('lembur.index');
    Route::get('/lembur/ajukan', [PengajuanLemburController::class, 'create'])->name('lembur.create');
    Route::post('/lembur', [PengajuanLemburController::class, 'store'])->name('lembur.store');

    // ROUTING KASBON / PINJAMAN (KARYAWAN)
    Route::get('/pinjaman', [PinjamanController::class, 'index'])->name('pinjaman.index');
    Route::get('/pinjaman/ajukan', [PinjamanController::class, 'create'])->name('pinjaman.create');
    Route::post('/pinjaman', [PinjamanController::class, 'store'])->name('pinjaman.store');

    // ROUTING SPJ / PERJALANAN DINAS (KARYAWAN)
    Route::get('/spj', [PengajuanSpjController::class, 'index'])->name('spj.index');
    Route::get('/spj/ajukan', [PengajuanSpjController::class, 'create'])->name('spj.create');
    Route::post('/spj', [PengajuanSpjController::class, 'store'])->name('spj.store');

    // ROUTING SLIP GAJI (KARYAWAN)
    Route::get('/slip-gaji', [PayrollController::class, 'myPayslips'])->name('slip.index');
    Route::get('/slip-gaji/{id}', [PayrollController::class, 'show'])->name('slip.show');

    // IT TICKET (KARYAWAN)
    Route::get('/it-ticket', [ItTicketController::class, 'index'])->name('ticket.index');
    Route::post('/it-ticket', [ItTicketController::class, 'store'])->name('ticket.store');
// 3. Rute Khusus Administrator (Dilindungi 'auth' DAN 'admin')
Route::middleware(['auth', 'admin'])->group(function () {

    // Monitor Absensi Admin
    Route::get('/absensi', [AbsensiController::class, 'index'])->name('absensi.index');

    // Approval Cuti Admin (Dipisah menjadi /admin/cuti agar tidak bentrok dengan Karyawan)
    Route::get('/admin/cuti', [PengajuanCutiController::class, 'adminIndex'])->name('admin.cuti.index');
    Route::post('/admin/cuti/{id}/status', [PengajuanCutiController::class, 'updateStatus'])->name('admin.cuti.update');

    Route::get('/admin/lembur', [PengajuanLemburController::class, 'adminIndex'])->name('admin.lembur.index');
    Route::post('/admin/lembur/{id}/status', [PengajuanLemburController::class, 'updateStatus'])->name('admin.lembur.update');

    // APPROVAL KASBON / PINJAMAN (ADMIN / FINANCE)
    Route::get('/admin/pinjaman', [PinjamanController::class, 'adminIndex'])->name('admin.pinjaman.index');
    Route::post('/admin/pinjaman/{id}/status', [PinjamanController::class, 'updateStatus'])->name('admin.pinjaman.update');

    // APPROVAL SPJ (ADMIN / FINANCE)
    Route::get('/admin/spj', [PengajuanSpjController::class, 'adminIndex'])->name('admin.spj.index');
    Route::post('/admin/spj/{id}/status', [PengajuanSpjController::class, 'updateStatus'])->name('admin.spj.update');

    Route::get('/admin/payroll', [PayrollController::class, 'index'])->name('admin.payroll.index');
    Route::post('/admin/payroll/generate', [PayrollController::class, 'generate'])->name('admin.payroll.generate');
    Route::post('/admin/payroll/{id}/finalize', [PayrollController::class, 'finalize'])->name('admin.payroll.finalize');

    // APPROVAL / MANAJEMEN IT TICKET (ADMIN)
    Route::get('/admin/it-ticket', [ItTicketController::class, 'adminIndex'])->name('admin.ticket.index');
    Route::post('/admin/it-ticket/{id}', [ItTicketController::class, 'update'])->name('admin.ticket.update');

    // Master Data
    Route::prefix('master-data')->group(function () {
        Route::resource('departemen', DepartemenController::class)->except(['create', 'show', 'edit']);
        Route::resource('jabatan', JabatanController::class)->except(['create', 'show', 'edit']);
        Route::resource('golongan', GolonganController::class)->except(['create', 'show', 'edit']);
    });

    // Operasional & Kepegawaian
    Route::prefix('kepegawaian')->group(function () {
        Route::resource('karyawan', KaryawanController::class);
        Route::post('karyawan/{id}/gaji', [KaryawanController::class, 'updateGaji'])->name('karyawan.updateGaji');
        Route::post('karyawan/{id}/jabatan', [KaryawanController::class, 'updateJabatan'])->name('karyawan.updateJabatan');

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

        // ==========================================
    // SISTEM PERSURATAN HC
    // ==========================================
    Route::prefix('persuratan')->group(function () {
        // Master Template (Hanya bisa diakses HC/Admin)
        Route::resource('template', App\Http\Controllers\Persuratan\MasterTemplateController::class);
        
        // Surat Keluar (Generate, Draft, Terbit)
        Route::resource('keluar', App\Http\Controllers\Persuratan\SuratKeluarController::class);
        Route::post('keluar/{id}/terbitkan', [App\Http\Controllers\Persuratan\SuratKeluarController::class, 'terbitkan'])->name('keluar.terbitkan');
        Route::post('keluar/{id}/batal', [App\Http\Controllers\Persuratan\SuratKeluarController::class, 'batalkan'])->name('keluar.batalkan');
        
        // Surat Masuk (Arsip)
        Route::resource('masuk', App\Http\Controllers\Persuratan\SuratMasukController::class);
    });
    });
});

require __DIR__ . '/auth.php';