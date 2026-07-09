<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vehicles', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('plate_number')->nullable();
            $table->foreignId('vehicle_model_id')->constrained()->restrictOnDelete();
            $table->foreignId('vehicle_category_id')->constrained()->restrictOnDelete();
            $table->foreignId('axle_configuration_id')->constrained()->restrictOnDelete();
            $table->foreignId('site_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('project_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('customer_id')->nullable()->constrained()->nullOnDelete();
            $table->unsignedBigInteger('odometer_km')->default(0);
            $table->unsignedBigInteger('engine_hours')->default(0);
            $table->string('status')->default('active');
            $table->date('commissioned_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vehicles');
    }
};
