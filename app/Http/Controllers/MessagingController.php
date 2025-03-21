<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MessagingController extends Controller
{
    /**
     * Display the messaging interface.
     */
    public function index()
    {
        // Get all users except the authenticated user
        $users = User::where('id', '!=', auth()->id())
            ->select('id', 'name', 'username', 'avatar')
            ->get()
            ->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'username' => $user->username,
                    'avatar' => $user->avatar,
                    // You can add these fields once you have the messages table
                    'lastMessage' => null,
                    'lastMessageTime' => null,
                    'unreadCount' => 0,
                ];
            });

        return Inertia::render('messaging', [
            'users' => $users
        ]);
    }

    /**
     * Get messages for a specific conversation.
     */
    public function getMessages(User $user)
    {
        // This is a placeholder - implement once you have the messages table
        return response()->json([
            'messages' => []
        ]);
    }

    /**
     * Send a message to a user.
     */
    public function sendMessage(Request $request, User $user)
    {
        $validated = $request->validate([
            'message' => 'required|string|max:1000',
        ]);

        // This is a placeholder - implement once you have the messages table
        // Create the message
        // $message = Message::create([
        //     'sender_id' => auth()->id(),
        //     'receiver_id' => $user->id,
        //     'content' => $validated['message'],
        // ]);

        return response()->json([
            'success' => true,
            // 'message' => $message
        ]);
    }

    /**
     * Mark messages as read.
     */
    public function markAsRead(User $user)
    {
        // This is a placeholder - implement once you have the messages table
        return response()->json([
            'success' => true
        ]);
    }
} 