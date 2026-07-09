<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tyre_sizes', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->unsignedSmallInteger('width_mm')->nullable();
            $table->unsignedSmallInteger('aspect_ratio')->nullable();
            $table->string('rim_diameter')->nullable();
            $table->text('description')->nullable();
            $table->string('status')->default('active');
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tyre_sizes');
    }
};
