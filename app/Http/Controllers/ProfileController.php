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
        $user = User::with(['posts' => function ($query) {
            $query->with(['user', 'attachments', 'likes', 'comments.user'])
                ->latest();
        }])->where('username', $username)->firstOrFail();

        $friendRequest = null;
        if (auth()->check() && auth()->id() !== $user->id) {
            $friendRequest = FriendRequest::where(function ($query) use ($user) {
                $query->where('sender_id', auth()->id())
                    ->where('receiver_id', $user->id);
            })->orWhere(function ($query) use ($user) {
                $query->where('sender_id', $user->id)
                    ->where('receiver_id', auth()->id());
            })->first();

            $user->friend_request = $friendRequest;
            $user->is_friend = auth()->user()->isFriendsWith($user);
        }

        // Ensure posts is always an array
        $user->posts = $user->posts ?? [];

        return Inertia::render('profile/show', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'username' => $user->username,
                'avatar' => $user->avatar,
                'verification_status' => $user->verification_status,
                'posts' => $user->posts,
                'friend_request' => $user->friend_request,
                'is_friend' => $user->is_friend ?? false,
            ],
            'isOwnProfile' => auth()->check() && auth()->id() === $user->id,
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
