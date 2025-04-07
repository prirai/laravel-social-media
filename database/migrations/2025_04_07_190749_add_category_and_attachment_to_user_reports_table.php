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
            Schema::table('user_reports', function (Blueprint $table) {
                $table->string('category')->after('reporter_id')->default('general'); // Add category after reporter_id, provide a default
                $table->string('attachment_path')->nullable()->after('reason'); // Add nullable attachment path after reason
            });
        }

        /**
         * Reverse the migrations.
         */
        public function down(): void
        {
            Schema::table('user_reports', function (Blueprint $table) {
                $table->dropColumn('category');
                $table->dropColumn('attachment_path');
            });
        }
    };
