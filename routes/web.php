<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\MasterData\DepartemenController;
use App\Http\Controllers\JabatanController;
use App\Http\Controllers\GolonganController;
use App\Http\Controllers\Kepegawaian\KaryawanController;
use App\Http\Controllers\AbsensiController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// 1. Arahkan pengguna ke halaman Login saat mengakses domain utama
Route::get('/', function () {
    return redirect()->route('login');
});

// 2. Rute Umum (Wajib Login - Bisa diakses Admin & Karyawan)
Route::middleware('auth')->group(function () {
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
    Route::get('/cuti', [App\Http\Controllers\PengajuanCutiController::class, 'index'])->name('cuti.index');
    Route::get('/cuti/ajukan', [App\Http\Controllers\PengajuanCutiController::class, 'create'])->name('cuti.create');
    Route::post('/cuti', [App\Http\Controllers\PengajuanCutiController::class, 'store'])->name('cuti.store');
});

// 3. Rute Khusus Administrator (Dilindungi 'auth' DAN 'admin')
Route::middleware(['auth', 'admin'])->group(function () {

    // Dashboard Admin
    Route::get('/dashboard', function () {
        return Inertia::render('Dashboard');
    })->name('dashboard');

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

        // Monitor Absensi Admin
        Route::get('/absensi', [AbsensiController::class, 'index'])->name('absensi.index');
    });
});

require __DIR__ . '/auth.php';
