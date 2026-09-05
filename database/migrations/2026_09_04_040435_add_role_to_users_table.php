<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Sesuai Playbook: 6 Role Utama
            $table->enum('role', ['Karyawan', 'Supervisor', 'HC', 'Finance', 'Admin', 'Direktur'])
                  ->default('Karyawan')
                  ->after('email');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('role');
        });
    }
};