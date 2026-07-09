<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inspections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tyre_id')->constrained()->cascadeOnDelete();
            $table->foreignId('vehicle_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('tyre_position_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('inspection_checklist_id')->nullable()->constrained()->nullOnDelete();
            $table->string('type');
            $table->decimal('tread_depth_mm', 5, 2)->nullable();
            $table->decimal('pressure_psi', 6, 2)->nullable();
            $table->decimal('temperature_c', 5, 2)->nullable();
            $table->foreignId('damage_type_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('failure_code_id')->nullable()->constrained()->nullOnDelete();
            $table->json('checklist_results')->nullable();
            $table->json('photos')->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('inspected_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('inspected_at');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inspections');
    }
};
