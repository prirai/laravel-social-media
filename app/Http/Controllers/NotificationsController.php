<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\Request;
use Inertia\Inertia;

class NotificationsController extends Controller
{
    /**
     * Get notifications for the authenticated user.
     */
    public function index()
    {
        $user = auth()->user();
        
        $notifications = Notification::where('user_id', $user->id)
            ->with('fromUser')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function($notification) {
                return [
                    'id' => $notification->id,
                    'type' => $notification->type,
                    'data' => $notification->data,
                    'read_at' => $notification->read_at,
                    'created_at' => $notification->created_at,
                    'route' => $notification->route,
                    'from_user' => $notification->fromUser ? [
                        'id' => $notification->fromUser->id,
                        'name' => $notification->fromUser->name,
                        'username' => $notification->fromUser->username,
                        'avatar' => $notification->fromUser->avatar,
                        'verification_status' => $notification->fromUser->verification_status,
                    ] : null,
                ];
            });
        
        return response()->json([
            'notifications' => $notifications,
            'unread_count' => $notifications->whereNull('read_at')->count(),
        ]);
    }

    /**
     * Get the count of unread notifications.
     */
    public function getUnreadCount()
    {
        $count = Notification::where('user_id', auth()->id())
            ->whereNull('read_at')
            ->count();
            
        return response()->json([
            'unread_count' => $count
        ]);
    }

    /**
     * Mark a notification as read.
     */
    public function markAsRead(Notification $notification)
    {
        // Ensure the notification belongs to the authenticated user
        if ($notification->user_id !== auth()->id()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }
        
        $notification->markAsRead();
        
        return response()->json([
            'success' => true,
            'notification' => $notification
        ]);
    }
    
    /**
     * Mark all notifications as read.
     */
    public function markAllAsRead()
    {
        Notification::where('user_id', auth()->id())
            ->whereNull('read_at')
            ->update(['read_at' => now()]);
            
        return response()->json([
            'success' => true
        ]);
    }
}
