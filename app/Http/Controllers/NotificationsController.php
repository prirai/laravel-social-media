<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Support\Facades\DB;

class NotificationsController extends Controller
{
    /**
     * Get notifications for the authenticated user.
     */
    public function index()
    {
        $user = auth()->user();
        
        // Cleanup any duplicate friend requests before fetching
        $this->cleanupDuplicateFriendRequests();
        
        // Get all notifications
        $allNotifications = Notification::where('user_id', $user->id)
            ->with('fromUser')
            ->orderBy('created_at', 'desc')
            ->get();
        
        // Transform the notifications for the response
        $transformedNotifications = $allNotifications->map(function($notification) {
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
            'unread_count' => $allNotifications->whereNull('read_at')->count(),
        ]);
    }

    /**
     * Get the count of unread notifications.
     */
    public function getUnreadCount()
    {
        $user = auth()->user();
        
        // Cleanup any duplicate friend requests before counting
        $this->cleanupDuplicateFriendRequests();
        
        // Get count of unread notifications
        $unreadCount = Notification::where('user_id', $user->id)
            ->whereNull('read_at')
            ->count();
            
        return response()->json([
            'unread_count' => $unreadCount
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
    
    /**
     * Clean up duplicate friend request notifications in the database.
     * This ensures only the most recent notification from each sender is kept.
     */
    private function cleanupDuplicateFriendRequests()
    {
        $user = auth()->user();
        
        // Get all friend request notifications for this user
        $friendRequests = DB::table('notifications')
            ->where('user_id', $user->id)
            ->where('type', 'friend_request')
            ->whereNotNull('from_user_id')
            ->orderBy('created_at', 'desc')
            ->get();
            
        // Group by from_user_id
        $processedSenders = [];
        $notificationsToKeep = [];
        
        foreach ($friendRequests as $notification) {
            $fromUserId = $notification->from_user_id;
            
            if (!in_array($fromUserId, $processedSenders)) {
                // Keep the first (most recent) notification from this sender
                $notificationsToKeep[] = $notification->id;
                $processedSenders[] = $fromUserId;
            }
        }
        
        // Delete all friend request notifications except the ones to keep
        if (!empty($friendRequests)) {
            DB::table('notifications')
                ->where('user_id', $user->id)
                ->where('type', 'friend_request')
                ->whereNotIn('id', $notificationsToKeep)
                ->delete();
        }
    }
}
