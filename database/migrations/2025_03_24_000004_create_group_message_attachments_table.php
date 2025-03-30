<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('group_message_attachments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('group_message_id')->constrained('group_messages')->onDelete('cascade');
            $table->string('file_path');
            $table->string('file_type');
            $table->string('file_name');
            $table->unsignedBigInteger('file_size');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('group_message_attachments');
    }
}; 