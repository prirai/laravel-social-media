<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('blocks', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('index');
            $table->timestamp('timestamp');
            $table->json('data');
            $table->string('previous_hash');
            $table->string('hash');
            $table->timestamps();

            $table->unique('index');
            $table->index('hash');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('blocks');
    }
}; 