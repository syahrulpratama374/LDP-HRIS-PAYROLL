<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    // Nilai jenis disatukan menjadi Pemasukan / Potongan (sebelumnya UI memakai "Tunjangan")
    public function up(): void
    {
        DB::table('master_komponen_payrolls')->where('jenis', 'Tunjangan')->update(['jenis' => 'Pemasukan']);
    }

    public function down(): void
    {
        // Tidak dapat dipulihkan: baris Pemasukan asli dari seeder tak bisa dibedakan dari hasil konversi.
    }
};
