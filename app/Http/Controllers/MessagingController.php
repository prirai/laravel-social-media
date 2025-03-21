<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Message;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class MessagingController extends Controller
{
    /**
     * Display the messaging interface.
     */
    public function index()
    {
        // Get users with existing conversations
        $users = User::where('id', '!=', auth()->id())
            ->select('id', 'name', 'username', 'avatar')
            ->withCount(['receivedMessages as unread_count' => function ($query) {
                $query->whereNull('read_at')
                    ->where('sender_id', '!=', auth()->id());
            }])
            ->with(['latestMessage' => function ($query) {
                $query->where(function ($q) {
                    $q->where('sender_id', auth()->id())
                        ->orWhere('receiver_id', auth()->id());
                });
            }])
            ->get()
            ->map(function ($user) {
                $lastMessage = $user->latestMessage;
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'username' => $user->username,
                    'avatar' => $user->avatar,
                    'lastMessage' => $lastMessage ? $lastMessage->content : null,
                    'lastMessageTime' => $lastMessage ? $lastMessage->created_at->diffForHumans() : null,
                    'unreadCount' => $user->unread_count,
                ];
            });

        // Get all users for the new message dialog
        $allUsers = User::select('id', 'name', 'username', 'avatar')
            ->get()
            ->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'username' => $user->username,
                    'avatar' => $user->avatar,
                ];
            });

        return Inertia::render('messaging', [
            'users' => $users,
            'allUsers' => $allUsers
        ]);
    }

    /**
     * Get messages for a specific conversation.
     */
    public function getMessages(User $user)
    {
        // Mark messages as read
        Message::where('sender_id', $user->id)
            ->where('receiver_id', auth()->id())
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        // Get messages between users
        $messages = Message::where(function ($query) use ($user) {
            $query->where('sender_id', auth()->id())
                ->where('receiver_id', $user->id);
        })->orWhere(function ($query) use ($user) {
            $query->where('sender_id', $user->id)
                ->where('receiver_id', auth()->id());
        })
        ->with('sender:id,name,username,avatar')
        ->orderBy('created_at', 'asc')
        ->get()
        ->map(function ($message) {
            return array_merge($message->toArray(), [
                'created_at' => $message->created_at->toISOString(),
            ]);
        });

        return response()->json([
            'messages' => $messages
        ]);
    }

    /**
     * Send a message to a user.
     */
    public function sendMessage(Request $request, User $user)
    {
        $validated = $request->validate([
            'content' => 'required|string|max:1000',
        ]);

        $message = Message::create([
            'sender_id' => auth()->id(),
            'receiver_id' => $user->id,
            'content' => $validated['content'],
        ]);

        // Load the message with sender information
        $message->load('sender:id,name,username,avatar');

        // Format the response to include all necessary information
        return response()->json([
            'message' => array_merge($message->toArray(), [
                'created_at' => $message->created_at->toISOString(),
            ])
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