<?php

namespace App\Widgets;

use App\Models\UserReport;
use Illuminate\Support\Facades\Route;
use Backpack\CRUD\app\Library\Widget;

class UserReportsWidget extends Widget
{
    public function getContent()
    {
        $recentReports = UserReport::with(['reportedUser', 'reporter'])
            ->where('status', 'pending')
            ->latest()
            ->take(5)
            ->get();

        return view('widgets.user_reports', [
            'reports' => $recentReports,
            'pending_count' => UserReport::where('status', 'pending')->count(),
        ])->render();
    }
} 