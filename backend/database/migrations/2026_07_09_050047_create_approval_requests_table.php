<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('approval_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('approval_workflow_id')->constrained()->restrictOnDelete();
            $table->string('requestable_type');
            $table->unsignedBigInteger('requestable_id');
            $table->foreignId('requested_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('status')->default('pending');
            $table->unsignedInteger('current_step')->default(1);
            $table->timestamps();

            $table->index(['requestable_type', 'requestable_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('approval_requests');
    }
};
