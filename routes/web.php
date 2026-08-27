<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\MasterData\DepartemenController;
use App\Http\Controllers\JabatanController;
use App\Http\Controllers\GolonganController;
use App\Http\Controllers\Kepegawaian\KaryawanController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// 1. Langsung arahkan pengguna ke halaman Login saat mengakses domain utama
Route::get('/', function () {
    return redirect()->route('login');
});

// 2. Rute Dashboard bawaan
Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

// 3. Rute yang dilindungi kata sandi (Wajib Login)
Route::middleware('auth')->group(function () {
    // Rute Profil
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
    
    // ==========================================
    // ROUTING MASTER DATA
    // ==========================================
    // Semua rute di dalam kotak ini akan diawali URL /master-data
    Route::prefix('master-data')->group(function () {
        Route::resource('departemen', DepartemenController::class)->except(['create', 'show', 'edit']);
        Route::resource('jabatan', JabatanController::class)->except(['create', 'show', 'edit']);
        Route::resource('golongan', GolonganController::class)->except(['create', 'show', 'edit']);
        
        // Rute Master Data lainnya seperti Jabatan dan Golongan akan ditambahkan di baris ini nanti
    });

    // ==========================================
    // ROUTING OPERASIONAL & KEPEGAWAIAN
    // ==========================================
    Route::prefix('kepegawaian')->group(function () {
        Route::resource('karyawan', KaryawanController::class);
    });
});

require __DIR__.'/auth.php';