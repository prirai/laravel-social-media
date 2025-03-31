<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Notification extends Model
{
    protected $fillable = [
        'user_id',
        'from_user_id',
        'type',
        'data',
        'read_at',
        'route',
    ];

    protected $casts = [
        'data' => 'array',
        'read_at' => 'datetime',
    ];

    /**
     * Get the user who received the notification.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the user who triggered the notification.
     */
    public function fromUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'from_user_id');
    }

    /**
     * Scope for unread notifications.
     */
    public function scopeUnread($query)
    {
        return $query->whereNull('read_at');
    }

    /**
     * Mark the notification as read.
     */
    public function markAsRead()
    {
        $this->update(['read_at' => now()]);
    }

    /**
     * Create a friend request notification.
     */
    public static function createFriendRequest($userId, $fromUserId, $friendRequestId)
    {
        return self::create([
            'user_id' => $userId,
            'from_user_id' => $fromUserId,
            'type' => 'friend_request',
            'data' => [
                'friend_request_id' => $friendRequestId,
            ],
            'route' => route('profile.show', User::find($fromUserId)->username),
        ]);
    }
}
