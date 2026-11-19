<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('surat_keluars', function (Blueprint $table) {
            // Nullable untuk draf lama; surat baru wajib memilih penerbit
            $table->foreignId('unit_penerbit_id')->nullable()->after('template_id')
                ->constrained('unit_penerbit_surats')->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('surat_keluars', function (Blueprint $table) {
            $table->dropConstrainedForeignId('unit_penerbit_id');
        });
    }
};
