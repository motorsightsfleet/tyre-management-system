<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('barcode_rfid_configs', function (Blueprint $table) {
            $table->id();
            $table->string('code_prefix')->default('TYR');
            $table->unsignedTinyInteger('code_length')->default(12);
            $table->string('symbology')->default('code128');
            $table->boolean('auto_generate')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('barcode_rfid_configs');
    }
};
