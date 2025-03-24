<?php

namespace App\Console\Commands;

use App\Models\Message;
use Illuminate\Console\Command;
use Carbon\Carbon;

class CleanupExpiredMessages extends Command
{
    protected $signature = 'messages:cleanup';
    protected $description = 'Remove expired messages from the database';

    public function handle()
    {
        $count = Message::where('expires_at', '<=', Carbon::now())->delete();
        $this->info("Deleted {$count} expired messages.");
    }
} 