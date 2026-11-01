<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Tabel Master Menus
        Schema::create('menus', function (Blueprint $table) {
            $table->id();
            $table->foreignId('parent_id')->nullable()->constrained('menus')->onDelete('cascade');
            $table->string('title');                  // Nama Tampilan (misal: "Approval Kasbon")
            $table->string('route_name')->nullable(); // Nama Route Ziggy (misal: "admin.pinjaman.index")
            $table->string('icon')->nullable();       // Nama Ikon Lucide React
            $table->integer('order')->default(0);     // Urutan Posisi
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // 2. Tabel Pivot Role Has Menus
        Schema::create('role_has_menus', function (Blueprint $table) {
            $table->id();
            $table->foreignId('role_id')->constrained('roles')->onDelete('cascade');
            $table->foreignId('menu_id')->constrained('menus')->onDelete('cascade');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('role_has_menus');
        Schema::dropIfExists('menus');
    }
};