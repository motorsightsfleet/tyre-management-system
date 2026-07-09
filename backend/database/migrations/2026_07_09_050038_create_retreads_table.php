<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('retreads', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tyre_id')->constrained()->cascadeOnDelete();
            $table->foreignId('retread_vendor_id')->constrained()->restrictOnDelete();
            $table->decimal('cost', 12, 2)->default(0);
            $table->date('sent_date');
            $table->date('received_date')->nullable();
            $table->unsignedInteger('retread_count_after')->default(1);
            $table->unsignedInteger('warranty_months')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('retreads');
    }
};
