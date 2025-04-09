<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use App\Models\AccessLog;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // First add the visit_count column
        Schema::table('access_logs', function (Blueprint $table) {
            $table->unsignedInteger('visit_count')->default(1);
        });

        // Then drop country and city columns
        Schema::table('access_logs', function (Blueprint $table) {
            $table->dropColumn(['country', 'city']);
        });

        // Handle duplicate entries by merging them
        $this->mergeDuplicateRecords();

        // Finally add the unique constraint
        Schema::table('access_logs', function (Blueprint $table) {
            $table->unique(['ip_address', 'url', 'browser', 'platform'], 'access_log_unique_visit');
        });
    }

    /**
     * Find and merge duplicate records to prepare for unique constraint
     */
    private function mergeDuplicateRecords()
    {
        // Get duplicates
        $duplicates = DB::table('access_logs')
            ->select('ip_address', 'url', 'browser', 'platform', DB::raw('COUNT(*) as count'), DB::raw('MAX(id) as max_id'), DB::raw('MIN(id) as min_id'))
            ->groupBy('ip_address', 'url', 'browser', 'platform')
            ->having(DB::raw('COUNT(*)'), '>', 1)
            ->get();

        foreach ($duplicates as $duplicate) {
            // Update the oldest record with the count
            DB::table('access_logs')
                ->where('id', $duplicate->min_id)
                ->update(['visit_count' => $duplicate->count]);
            
            // Delete the other records (keeping the oldest)
            DB::table('access_logs')
                ->where('ip_address', $duplicate->ip_address)
                ->where('url', $duplicate->url)
                ->where('browser', $duplicate->browser)
                ->where('platform', $duplicate->platform)
                ->where('id', '!=', $duplicate->min_id)
                ->delete();
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('access_logs', function (Blueprint $table) {
            // Drop the unique index
            $table->dropUnique('access_log_unique_visit');
        });
        
        Schema::table('access_logs', function (Blueprint $table) {
            // Drop the visit_count column
            $table->dropColumn('visit_count');
            
            // Add back country and city columns
            $table->string('country')->nullable();
            $table->string('city')->nullable();
        });
    }
};
