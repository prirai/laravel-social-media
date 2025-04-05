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
        
        // Get all notifications
        $allNotifications = Notification::where('user_id', $user->id)
            ->with('fromUser')
            ->orderBy('created_at', 'desc')
            ->get();
        
        // Handle duplicate friend requests by keeping only the most recent one from each user
        $friendRequestIds = [];
        $filteredNotifications = collect();
        
        foreach ($allNotifications as $notification) {
            // For friend requests, only keep the most recent from each sender
            if ($notification->type === 'friend_request' && isset($notification->from_user_id)) {
                $fromUserId = $notification->from_user_id;
                
                // If we haven't seen this sender yet, or this notification is newer
                if (!isset($friendRequestIds[$fromUserId])) {
                    $friendRequestIds[$fromUserId] = $notification->id;
                    $filteredNotifications->push($notification);
                }
            } else {
                // Keep all other notification types
                $filteredNotifications->push($notification);
            }
        }
        
        // Transform the notifications for the response
        $transformedNotifications = $filteredNotifications->map(function($notification) {
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
            'notifications' => $transformedNotifications,
            'unread_count' => $filteredNotifications->whereNull('read_at')->count(),
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
