<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\UserReport;
use App\Models\FriendRequest;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProfileController extends Controller
{
    public function show(string $username)
    {
        $user = User::where('username', $username)
            ->with(['posts.user', 'posts.likes', 'posts.comments.user', 'posts.attachments'])
            ->firstOrFail();
        
        $isOwnProfile = auth()->check() && auth()->id() === $user->id;
        
        // Check if there's a friend request between the users
        $friendRequest = null;
        $isFriend = false;
        $friends = [];
        
        if (auth()->check()) {
            if (!$isOwnProfile) {
                // Check if they are friends
                $isFriend = auth()->user()->isFriendsWith($user);
                
                // Check for any friend request (sent OR received)
                $friendRequest = FriendRequest::where(function ($query) use ($user) {
                    $query->where('sender_id', auth()->id())
                          ->where('receiver_id', $user->id);
                })->orWhere(function ($query) use ($user) {
                    $query->where('sender_id', $user->id)
                          ->where('receiver_id', auth()->id());
                })->first();
            }
            
            // Get user's friends
            $friends = $user->friends()
                ->select('users.id', 'users.name', 'users.username', 'users.avatar', 'users.verification_status')
                ->get();
        }
        
        // Format the user data
        $userData = [
            'id' => $user->id,
            'name' => $user->name,
            'username' => $user->username,
            'avatar' => $user->avatar,
            'verification_status' => $user->verification_status,
            'created_at' => $user->created_at,
            'posts' => $user->posts->map(function ($post) {
                return [
                    'id' => $post->id,
                    'content' => $post->content,
                    'user_id' => $post->user_id,
                    'created_at' => $post->created_at,
                    'updated_at' => $post->updated_at,
                    'user' => $post->user,
                    'likes' => $post->likes,
                    'comments' => $post->comments,
                    'attachments' => $post->attachments,
                ];
            }),
            'is_friend' => $isFriend,
            'friends' => $friends,
        ];
        
        // Add friend request data if it exists
        if ($friendRequest) {
            $userData['friend_request'] = [
                'id' => $friendRequest->id,
                'status' => $friendRequest->status,
                'sender_id' => $friendRequest->sender_id,
                'receiver_id' => $friendRequest->receiver_id,
            ];
        }
        
        return Inertia::render('profile/show', [
            'user' => $userData,
            'isOwnProfile' => $isOwnProfile,
        ]);
    }

    public function report(Request $request, $username)
    {
        $user = User::where('username', $username)->firstOrFail();

        $validated = $request->validate([
            'reason' => 'required|string|max:1000'
        ]);

        UserReport::create([
            'reported_user_id' => $user->id,
            'reporter_id' => auth()->id(),
            'reason' => $validated['reason']
        ]);

        return back()->with('success', 'Report submitted successfully');
    }
}
