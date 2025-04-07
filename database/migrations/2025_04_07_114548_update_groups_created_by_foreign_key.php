<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('groups', function (Blueprint $table) {
            // First drop the existing foreign key
            $table->dropForeign(['created_by']);
            
            // Then add it back with cascade delete
            $table->foreign('created_by')
                  ->references('id')
                  ->on('users')
                  ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('groups', function (Blueprint $table) {
            // Drop the cascade foreign key
            $table->dropForeign(['created_by']);
            
            // Add back the original foreign key without cascade
            $table->foreign('created_by')
                  ->references('id')
                  ->on('users');
        });
    }
};
