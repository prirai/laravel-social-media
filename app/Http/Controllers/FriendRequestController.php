<?php

namespace App\Http\Controllers;

use App\Models\FriendRequest;
use App\Models\User;
use App\Models\Friendship;
use Illuminate\Http\Request;
use Inertia\Inertia;

class FriendRequestController extends Controller
{
    public function send(Request $request, string $username)
    {
        // Find user by username
        $user = User::where('username', $username)->firstOrFail();

        // Check if request already exists
        $existingRequest = FriendRequest::where(function ($query) use ($user) {
            $query->where('sender_id', auth()->id())
                ->where('receiver_id', $user->id);
        })->orWhere(function ($query) use ($user) {
            $query->where('sender_id', $user->id)
                ->where('receiver_id', auth()->id());
        })->first();

        if ($existingRequest) {
            return back()->with('error', 'Friend request already exists.');
        }

        // Create new friend request
        FriendRequest::create([
            'sender_id' => auth()->id(),
            'receiver_id' => $user->id,
            'status' => 'pending',
        ]);

        return back()->with('success', 'Friend request sent successfully.');
    }

    public function accept(FriendRequest $friendRequest)
    {
        if ($friendRequest->receiver_id !== auth()->id()) {
            return back()->with('error', 'Unauthorized action.');
        }

        $friendRequest->update(['status' => 'accepted']);

        // Create friendship records for both users
        Friendship::create([
            'user_id' => $friendRequest->sender_id,
            'friend_id' => $friendRequest->receiver_id,
        ]);

        Friendship::create([
            'user_id' => $friendRequest->receiver_id,
            'friend_id' => $friendRequest->sender_id,
        ]);

        return back()->with('success', 'Friend request accepted.');
    }

    public function reject(FriendRequest $friendRequest)
    {
        if ($friendRequest->receiver_id !== auth()->id()) {
            return back()->with('error', 'Unauthorized action.');
        }

        $friendRequest->update(['status' => 'rejected']);

        return back()->with('success', 'Friend request rejected.');
    }

    public function cancel(FriendRequest $friendRequest)
    {
        // Allow both sender and receiver to cancel the request
        if ($friendRequest->sender_id !== auth()->id() && $friendRequest->receiver_id !== auth()->id()) {
            return back()->with('error', 'Unauthorized action.');
        }

        $friendRequest->delete();

        return back()->with('success', 'Friend request cancelled.');
    }
} 