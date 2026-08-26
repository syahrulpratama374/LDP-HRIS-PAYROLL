<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('approvals', function (Blueprint $table) {
            $table->id();
            $table->morphs('approvable'); // Otomatis membuat approvable_type & approvable_id
            $table->foreignId('approver_id')->constrained('users')->cascadeOnDelete();
            $table->integer('level_approval')->comment('1: SPV, 2: HC, 3: Finance/Direktur');
            $table->string('status', 30)->default('Pending');
            $table->text('catatan')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('approvals');
    }
};
