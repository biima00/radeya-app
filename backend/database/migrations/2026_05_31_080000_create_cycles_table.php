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
        Schema::create('cycles', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('animal');
            $table->integer('scale');
            $table->string('mode');
            $table->json('data')->nullable();
            $table->foreignId('org_id')->constrained('organizations')->cascadeOnDelete();
            $table->timestamps();

            // Composite index for fast listing cycles by organization sorted by newest
            $table->index(['org_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cycles');
    }
};
