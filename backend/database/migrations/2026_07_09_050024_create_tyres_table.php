<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tyres', function (Blueprint $table) {
            $table->id();
            $table->string('serial_number')->unique();
            $table->string('barcode_code')->nullable()->unique();
            $table->string('rfid_code')->nullable()->unique();
            $table->foreignId('tyre_brand_id')->constrained()->restrictOnDelete();
            $table->foreignId('tyre_pattern_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('tyre_size_id')->constrained()->restrictOnDelete();
            $table->foreignId('tyre_type_id')->constrained()->restrictOnDelete();
            $table->foreignId('supplier_id')->nullable()->constrained()->nullOnDelete();
            $table->date('manufacture_date')->nullable();
            $table->decimal('tread_depth_new_mm', 5, 2)->nullable();
            $table->decimal('cost', 12, 2)->default(0);
            $table->string('status')->default('in_stock');
            $table->foreignId('current_warehouse_id')->nullable()->constrained('warehouses')->nullOnDelete();
            $table->foreignId('current_vehicle_id')->nullable()->constrained('vehicles')->nullOnDelete();
            $table->foreignId('current_tyre_position_id')->nullable()->constrained('tyre_positions')->nullOnDelete();
            $table->unsignedInteger('retread_count')->default(0);
            $table->string('photo_url')->nullable();
            $table->unsignedInteger('warranty_months')->nullable();
            $table->date('purchased_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tyres');
    }
};
