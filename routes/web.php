<?php

use Illuminate\Support\Facades\Route;

// 1. IMPORT CONTROLLER (DIKELOMPOKKAN BERDASARKAN SUB-FOLDER)
use App\Http\Controllers\{
    ProfileController, DashboardController, AbsensiController, 
    PengajuanCutiController, PengajuanLemburController, PinjamanController, 
    PengajuanSpjController, PayrollController, ItTicketController, 
    SuratPeringatanController, PenilaianKinerjaController, DelegasiWewenangController,
    JabatanController, GolonganController, AuditTrailController, PengaturanController,
    AsetController, PengumumanController
};

use App\Http\Controllers\Persuratan\{
    MasterTemplateController,
    SuratKeluarController,
    PengaturanLayoutController,
    SuratMasukController
};

use App\Http\Controllers\MasterData\{
    DepartemenController,
    MasterShiftController
};

use App\Http\Controllers\Kepegawaian\{
    KaryawanController,
    MasterCutiLiburController
};

use App\Http\Controllers\Payroll\MasterKomponenPayrollController;
use App\Http\Controllers\ItTicket\LogbookController;

// =========================================================================
// 2. RUTE PUBLIK (TANPA LOGIN)
// =========================================================================
Route::get('/', function () {
    return redirect()->route('login');
});

Route::get('/scan-aset/{kode_aset}', [AsetController::class, 'showPublic'])->name('aset.scan');
Route::get('/verifikasi/surat/{uuid}', [SuratKeluarController::class, 'verifikasi'])->name('surat.verifikasi');



// =========================================================================
// 3. RUTE UMUM KARYAWAN (WAJIB LOGIN)
// =========================================================================
Route::middleware(['auth'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Profil User
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
    Route::post('/profile/foto', [ProfileController::class, 'updateFoto'])->name('profile.foto.update');

    // Self-Service Karyawan
    Route::get('/absensi/karyawan', [AbsensiController::class, 'create'])->name('absensi.create');
    Route::post('/absensi/karyawan', [AbsensiController::class, 'store'])->name('absensi.store');

    Route::get('/cuti', [PengajuanCutiController::class, 'index'])->name('cuti.index');
    Route::get('/cuti/ajukan', [PengajuanCutiController::class, 'create'])->name('cuti.create');
    Route::post('/cuti', [PengajuanCutiController::class, 'store'])->name('cuti.store');

    Route::get('/lembur', [PengajuanLemburController::class, 'index'])->name('lembur.index');
    Route::get('/lembur/ajukan', [PengajuanLemburController::class, 'create'])->name('lembur.create');
    Route::post('/lembur', [PengajuanLemburController::class, 'store'])->name('lembur.store');

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

    Route::get('/logbook-shift', [LogbookController::class, 'index'])->name('logbook.index');
    Route::post('/logbook-shift', [LogbookController::class, 'store'])->name('logbook.store');
});

// =========================================================================
// 4. MODUL E-PERSURATAN LDP (WAJIB LOGIN & VERIFIED)
// =========================================================================
Route::middleware(['auth', 'verified'])->prefix('persuratan')->group(function () {
    // Master Template & Rute Approval
    Route::get('/template', [MasterTemplateController::class, 'index'])->name('template.index');
    Route::post('/template', [MasterTemplateController::class, 'store'])->name('template.store');

    // Surat Keluar & Multi-Level Approval (CRUD Lengkap)
    Route::get('/keluar', [SuratKeluarController::class, 'index'])->name('keluar.index');
    Route::get('/keluar/create', [SuratKeluarController::class, 'create'])->name('keluar.create');
    Route::post('/keluar', [SuratKeluarController::class, 'store'])->name('keluar.store');
    Route::get('/keluar/{id}/edit', [SuratKeluarController::class, 'edit'])->name('keluar.edit');
    Route::put('/keluar/{id}', [SuratKeluarController::class, 'update'])->name('keluar.update');
    Route::delete('/keluar/{id}', [SuratKeluarController::class, 'destroy'])->name('keluar.destroy');

    // Action Aksi: Approval, Tolak/Revisi, Void (Pembatalan), & Unduh PDF
    Route::post('/keluar/{id}/approve', [SuratKeluarController::class, 'approve'])->name('keluar.approve');
    Route::post('/keluar/{id}/tolak', [SuratKeluarController::class, 'tolak'])->name('keluar.tolak');
    Route::post('/keluar/{id}/batal', [SuratKeluarController::class, 'batalkan'])->name('keluar.batalkan');
    Route::get('/keluar/{id}/pdf', [SuratKeluarController::class, 'unduhPdf'])->name('keluar.pdf');

    // Pengaturan Layout Aset Visual (Kop, Watermark & Banner Footer)
    Route::get('/layout', [PengaturanLayoutController::class, 'index'])->name('layout.index');
    Route::post('/layout', [PengaturanLayoutController::class, 'store'])->name('layout.store');
});

// Rute Verifikasi Publik QR Code (Ditaruh di Luar Middleware Auth agar Pihak Luar Bisa Scan)
Route::get('/v/{uuid}', [SuratKeluarController::class, 'verifikasi'])->name('keluar.verifikasi');


// =========================================================================
// 5. RUTE MANAJERIAL & OPERASIONAL (BERDASARKAN ROLE)
// =========================================================================

// A. SPV (5), HC (3), Admin (1) -> Approval Kehadiran
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

// B. Finance (4) & Admin (1) -> Keuangan & Payroll
Route::middleware(['auth', 'role:1,4'])->group(function () {
    Route::get('/admin/pinjaman', [PinjamanController::class, 'adminIndex'])->name('admin.pinjaman.index');
    Route::post('/admin/pinjaman/{id}/status', [PinjamanController::class, 'updateStatus'])->name('admin.pinjaman.update');

    Route::get('/admin/payroll', [PayrollController::class, 'index'])->name('admin.payroll.index');
    Route::post('/admin/payroll/generate', [PayrollController::class, 'generate'])->name('admin.payroll.generate');
    Route::post('/admin/payroll/{id}/finalize', [PayrollController::class, 'finalize'])->name('admin.payroll.finalize');

    Route::resource('/admin/komponen-gaji', MasterKomponenPayrollController::class)
        ->names('admin.komponen')
        ->except(['create', 'show', 'edit']);
});

// C. SPV (5), Finance (4), Direktur (2), Admin (1) -> SPJ
Route::middleware(['auth', 'role:1,2,4,5'])->group(function () {
    Route::get('/admin/spj', [PengajuanSpjController::class, 'adminIndex'])->name('admin.spj.index');
    Route::post('/admin/spj/{id}/status', [PengajuanSpjController::class, 'updateStatus'])->name('admin.spj.update');
});

// D. Khusus HC (3) & Admin (1) -> Kepegawaian & Master Data
Route::middleware(['auth', 'role:1,3'])->group(function () {
    Route::get('/absensi', [AbsensiController::class, 'index'])->name('absensi.index');
    
    // Master Data
    Route::prefix('master-data')->group(function () {
        Route::resource('departemen', DepartemenController::class)->except(['create', 'show', 'edit']);
        Route::resource('jabatan', JabatanController::class)->except(['create', 'show', 'edit']);
        Route::resource('golongan', GolonganController::class)->except(['create', 'show', 'edit']);
        Route::resource('shift', MasterShiftController::class)->except(['create', 'show', 'edit']);

        // Master Cuti & Kalender Libur
        Route::get('/hc/master-cuti', [MasterCutiLiburController::class, 'index'])->name('hc.cuti.index');
        Route::post('/hc/master-cuti/default', [MasterCutiLiburController::class, 'updateDefaultCuti'])->name('hc.cuti.default');
        Route::post('/hc/master-cuti/libur', [MasterCutiLiburController::class, 'storeLibur'])->name('hc.libur.store');
        Route::delete('/hc/master-cuti/libur/{id}', [MasterCutiLiburController::class, 'destroyLibur'])->name('hc.libur.destroy');
    });

    // Kepegawaian & Disiplin
    Route::prefix('kepegawaian')->group(function () {
        Route::resource('karyawan', KaryawanController::class);
        Route::post('karyawan/{id}/gaji', [KaryawanController::class, 'updateGaji'])->name('karyawan.updateGaji');
        Route::post('karyawan/{id}/jabatan', [KaryawanController::class, 'updateJabatan'])->name('karyawan.updateJabatan');
        Route::post('karyawan/{id}/dokumen', [KaryawanController::class, 'uploadDokumen'])->name('karyawan.dokumen.store');
        Route::delete('karyawan/{id}/dokumen/{dokumen_id}', [KaryawanController::class, 'deleteDokumen'])->name('karyawan.dokumen.destroy');
        Route::post('karyawan/{id}/foto', [KaryawanController::class, 'uploadFotoProfil'])->name('karyawan.foto.store');
        
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

    // Surat Masuk
    Route::prefix('persuratan')->group(function () {
        Route::resource('masuk', SuratMasukController::class);
    });
});

// E. Super Admin (1) -> Master IT & Settings
Route::middleware(['auth', 'role:1'])->group(function () {
    Route::get('/admin/it-ticket', [ItTicketController::class, 'adminIndex'])->name('admin.ticket.index');
    Route::post('/admin/it-ticket/{id}', [ItTicketController::class, 'update'])->name('admin.ticket.update');

    Route::get('/admin/pengaturan', [PengaturanController::class, 'index'])->name('admin.pengaturan.index');
    Route::post('/admin/pengaturan', [PengaturanController::class, 'store'])->name('admin.pengaturan.store');

    Route::get('/admin/audit-trails', [AuditTrailController::class, 'index'])->name('admin.audit.index');

    Route::resource('/admin/aset', AsetController::class)->names([
        'index'   => 'admin.aset.index',
        'create'  => 'admin.aset.create',
        'store'   => 'admin.aset.store',
        'edit'    => 'admin.aset.edit',
        'update'  => 'admin.aset.update',
        'destroy' => 'admin.aset.destroy',
    ])->except(['show']);
}); 

// F. Broadcast & Pengumuman Internal (Admin, Direktur, HC)
Route::middleware(['auth', 'role:1,2,3'])->group(function () {
    Route::resource('/pengumuman', PengumumanController::class)->except(['show', 'edit', 'update']);
});

require __DIR__ . '/auth.php';