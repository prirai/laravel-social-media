<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FriendRequest extends Model
{
    protected $fillable = [
        'sender_id',
        'receiver_id',
        'status',
    ];

    protected $casts = [
        'status' => 'string',
    ];

    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    public function receiver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'receiver_id');
    }
    
    // Helper method to check if a request exists between two users
    public static function existsBetween($user1Id, $user2Id)
    {
        return self::where(function ($query) use ($user1Id, $user2Id) {
                $query->where('sender_id', $user1Id)
                      ->where('receiver_id', $user2Id);
            })
            ->orWhere(function ($query) use ($user1Id, $user2Id) {
                $query->where('sender_id', $user2Id)
                      ->where('receiver_id', $user1Id);
            })
            ->exists();
    }
} 