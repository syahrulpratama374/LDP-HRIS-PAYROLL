<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// --- JADWAL ROBOT LDP ---
// Menjalankan tugas otomatis setiap malam pukul 00:00
Schedule::command('ldp:daily-automation')->dailyAt('00:00');