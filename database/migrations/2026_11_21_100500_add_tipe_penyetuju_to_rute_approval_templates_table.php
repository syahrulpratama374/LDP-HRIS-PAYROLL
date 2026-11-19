<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Rute approval template bisa menunjuk ROLE (mis. HC, Finance) selain JABATAN.
 * - tipe_penyetuju: 'jabatan' (default, perilaku lama) | 'role'
 * - role_id       : diisi bila tipe 'role'
 * - jabatan_id    : kini nullable (kosong bila tipe 'role'); FK tetap ada
 * Surat Keluar tetap hanya memakai rute bertipe jabatan.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('rute_approval_templates', function (Blueprint $table) {
            $table->string('tipe_penyetuju', 10)->default('jabatan')->after('urutan_langkah');
            $table->foreignId('role_id')->nullable()->after('tipe_penyetuju')
                ->constrained('roles')->restrictOnDelete();
            $table->unsignedBigInteger('jabatan_id')->nullable()->change();
        });
    }

    public function down(): void
    {
        // Langkah bertipe role tidak bisa direpresentasikan di skema lama
        DB::table('rute_approval_templates')->where('tipe_penyetuju', 'role')->delete();

        Schema::table('rute_approval_templates', function (Blueprint $table) {
            $table->unsignedBigInteger('jabatan_id')->nullable(false)->change();
            $table->dropConstrainedForeignId('role_id');
            $table->dropColumn('tipe_penyetuju');
        });
    }
};
