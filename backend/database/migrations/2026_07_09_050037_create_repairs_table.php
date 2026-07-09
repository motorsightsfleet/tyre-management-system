<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('repairs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tyre_id')->constrained()->cascadeOnDelete();
            $table->foreignId('repair_type_id')->constrained()->restrictOnDelete();
            $table->foreignId('vendor_id')->nullable()->constrained('suppliers')->nullOnDelete();
            $table->decimal('cost', 12, 2)->default(0);
            $table->decimal('tread_before_mm', 5, 2)->nullable();
            $table->decimal('tread_after_mm', 5, 2)->nullable();
            $table->foreignId('repaired_by')->nullable()->constrained('users')->nullOnDelete();
            $table->date('repair_date');
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('repairs');
    }
};
