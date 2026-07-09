<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tyre_installations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tyre_id')->constrained()->cascadeOnDelete();
            $table->foreignId('vehicle_id')->constrained()->cascadeOnDelete();
            $table->foreignId('tyre_position_id')->constrained()->restrictOnDelete();
            $table->foreignId('installed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('installed_at');
            $table->unsignedBigInteger('odometer_km_at_install')->default(0);
            $table->unsignedBigInteger('engine_hours_at_install')->default(0);
            $table->timestamp('removed_at')->nullable();
            $table->foreignId('removed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->unsignedBigInteger('odometer_km_at_removal')->nullable();
            $table->unsignedBigInteger('engine_hours_at_removal')->nullable();
            $table->foreignId('removal_reason_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('tyre_rotation_id')->nullable()->constrained()->nullOnDelete();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['vehicle_id', 'tyre_position_id', 'removed_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tyre_installations');
    }
};
