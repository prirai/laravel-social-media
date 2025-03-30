<?php

namespace App\Models;

use Backpack\CRUD\app\Models\Traits\CrudTrait;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class User extends Authenticatable 
{
    use CrudTrait, HasApiTokens, HasFactory, Notifiable;
    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'username',
        'email',
        'password',
        'avatar',
        'verification_status',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'verification_status' => 'string',
    ];

    protected $visible = [
        'id',
        'name',
        'username',
        'avatar',
        'verification_status'
    ];

    public function posts(): HasMany
    {
        return $this->hasMany(Post::class);
    }

    public function likes(): HasMany
    {
        return $this->hasMany(Like::class);
    }

    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class);
    }

    public function receivedMessages()
    {
        return $this->hasMany(Message::class, 'receiver_id');
    }

    public function latestMessage()
    {
        return $this->hasOne(Message::class, 'receiver_id')
            ->latest()
            ->orWhere('sender_id', $this->id);
    }

    public function groups()
    {
        return $this->belongsToMany(Group::class)->withTimestamps();
    }

    public function groupMessages()
    {
        return $this->hasMany(GroupMessage::class);
    }

    public function verificationDocuments()
    {
        return $this->hasMany(VerificationDocument::class);
    }

    // public function verificationDocument()
    // {
    //     return $this->hasOne(VerificationDocument::class);
    // }

    public function getVerificationStatusAttribute($value)
    {
        \Log::info('Getting verification status for user ' . $this->id . ': ' . $value);
        return $value ?? 'unverified';
    }

    public function friends(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'friendships', 'user_id', 'friend_id')
            ->withTimestamps();
    }

    public function isFriendsWith(User $user): bool
    {
        return $this->friends()->where('friend_id', $user->id)->exists() ||
               $user->friends()->where('friend_id', $this->id)->exists();
    }

    // public function setPasswordAttribute($value)
    // {
    //     if (!empty($value)) {
    //         $this->attributes['password'] = bcrypt($value);
    //     }
    // }

    public function lastDirectMessage()
    {
        // This approach uses a subquery to find the latest message where the user is either sender or receiver
        return Message::where(function($query) {
                $query->where('sender_id', $this->id)
                      ->orWhere('receiver_id', $this->id);
            })
            ->latest()
            ->limit(1);
    }
}
