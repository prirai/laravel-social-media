<?php

namespace App\Http\Controllers;

use App\Models\FriendRequest;
use App\Models\User;
use App\Models\Friendship;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Notification;

class FriendRequestController extends Controller
{
    public function send(Request $request, string $username)
    {
        // Find user by username
        $user = User::where('username', $username)->firstOrFail();
        
        // Prevent sending request to self
        if ($user->id === auth()->id()) {
            return back()->with('error', 'You cannot send a friend request to yourself.');
        }
        
        // Check if they are already friends
        if (auth()->user()->isFriendsWith($user)) {
            return back()->with('error', 'You are already friends with this user.');
        }

        // Check if request already exists
        if (FriendRequest::existsBetween(auth()->id(), $user->id)) {
            return back()->with('error', 'A friend request already exists between you and this user.');
        }

        // Create new friend request
        $friendRequest = FriendRequest::create([
            'sender_id' => auth()->id(),
            'receiver_id' => $user->id,
            'status' => 'pending',
        ]);

        // Create notification for the receiver
        Notification::createFriendRequest(
            $user->id, 
            auth()->id(), 
            $friendRequest->id
        );

        // Return the updated user data for the frontend
        $updatedUser = $this->getUserWithFriendRequestData($user);
        
        return back()->with([
            'success' => 'Friend request sent successfully.',
            'user' => $updatedUser
        ]);
    }

    public function accept(FriendRequest $friendRequest)
    {
        // Verify the authenticated user is the receiver
        if ($friendRequest->receiver_id !== auth()->id()) {
            return back()->with('error', 'Unauthorized action.');
        }

        // Update request status
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

        // Get the updated user data
        $user = User::findOrFail($friendRequest->sender_id);
        $updatedUser = $this->getUserWithFriendRequestData($user);

        return back()->with([
            'success' => 'Friend request accepted.',
            'user' => $updatedUser
        ]);
    }

    public function reject(FriendRequest $friendRequest)
    {
        // Verify the authenticated user is the receiver
        if ($friendRequest->receiver_id !== auth()->id()) {
            return back()->with('error', 'Unauthorized action.');
        }

        // Update request status
        $friendRequest->update(['status' => 'rejected']);

        // Get the updated user data
        $user = User::findOrFail($friendRequest->sender_id);
        $updatedUser = $this->getUserWithFriendRequestData($user);

        return back()->with([
            'success' => 'Friend request rejected.',
            'user' => $updatedUser
        ]);
    }

    public function cancel(FriendRequest $friendRequest)
    {
        // Verify the authenticated user is the sender
        if ($friendRequest->sender_id !== auth()->id()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        // Delete the request
        $friendRequest->delete();

        // Get the updated user data
        $user = User::findOrFail($friendRequest->receiver_id);
        $updatedUser = $this->getUserWithFriendRequestData($user);

        return back()->with([
            'success' => 'Friend request cancelled.',
            'user' => $updatedUser
        ]);
    }
    
    // Helper method to get user data with friend request information
    private function getUserWithFriendRequestData(User $user)
    {
        $currentUser = auth()->user();
        
        // Check if they are friends
        $isFriend = $currentUser->isFriendsWith($user);
        
        // Check for any friend request
        $friendRequest = FriendRequest::where(function ($query) use ($user, $currentUser) {
            $query->where('sender_id', $currentUser->id)
                  ->where('receiver_id', $user->id);
        })->orWhere(function ($query) use ($user, $currentUser) {
            $query->where('sender_id', $user->id)
                  ->where('receiver_id', $currentUser->id);
        })->first();
        
        $userData = [
            'id' => $user->id,
            'name' => $user->name,
            'username' => $user->username,
            'avatar' => $user->avatar,
            'verification_status' => $user->verification_status,
            'is_friend' => $isFriend,
        ];
        
        if ($friendRequest) {
            $userData['friend_request'] = [
                'id' => $friendRequest->id,
                'status' => $friendRequest->status,
                'sender_id' => $friendRequest->sender_id,
                'receiver_id' => $friendRequest->receiver_id,
            ];
        }
        
        return $userData;
    }
} 