<?php

namespace App\Widgets;

use App\Models\VerificationDocument;
use Illuminate\Support\Facades\Auth;
use Backpack\CRUD\app\Library\Widget;

class VerificationDocumentsWidget extends Widget
{
    public function getViewName()
    {
        return 'widgets.verification_documents';
    }

    public function getViewData()
    {
        return [
            'verifications' => VerificationDocument::whereHas('user', function($query) {
                    $query->where('verification_status', 'pending');
                })
                ->with('user')
                ->latest()
                ->take(5)
                ->get(),
            'pending_count' => VerificationDocument::whereHas('user', function($query) {
                    $query->where('verification_status', 'pending');
                })->count(),
        ];
    }
} 