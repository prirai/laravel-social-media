<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Message;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use App\Models\Group;
use App\Models\GroupMessage;

class MessagingController extends Controller
{
    /**
     * Display the messaging interface.
     */
    public function index()
    {
        $users = User::where('id', '!=', auth()->id())
            ->select('id', 'name', 'username', 'avatar', 'verification_status')
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
                    'verification_status' => $user->verification_status,
                ];
            });

        // Get group conversations
        $groups = Group::whereHas('users', function ($query) {
            $query->where('user_id', auth()->id());
        })
        ->with(['latestMessage.user:id,name', 'users:id,name,avatar,verification_status'])
        ->get()
        ->map(function ($group) {
            $lastMessage = $group->latestMessage;
            return [
                'id' => 'group_' . $group->id,
                'name' => $group->name,
                'avatar' => $group->avatar,
                'isGroup' => true,
                'members' => $group->users,
                'lastMessage' => $lastMessage ? $lastMessage->content : null,
                'lastMessageTime' => $lastMessage ? $lastMessage->created_at->diffForHumans() : null,
                'unreadCount' => 0,
            ];
        });

        return Inertia::render('messaging', [
            'users' => $users,
            'groups' => $groups,
            'allUsers' => User::select('id', 'name', 'username', 'avatar', 'verification_status')->get(),
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

    public function createGroup(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'users' => 'required|array|min:2',
            'users.*' => 'exists:users,id',
            'avatar' => 'nullable|image|max:5120',
        ]);

        $group = Group::create([
            'name' => $validated['name'],
            'created_by' => auth()->id(),
        ]);

        if ($request->hasFile('avatar')) {
            $path = $request->file('avatar')->store('groups', 'public');
            $group->update(['avatar' => '/storage/' . $path]);
        }

        // Add creator and selected users to the group
        $group->users()->attach(array_unique([auth()->id(), ...$validated['users']]));

        return response()->json([
            'group' => $group->load('users'),
        ]);
    }

    public function sendGroupMessage(Request $request, Group $group)
    {
        $validated = $request->validate([
            'content' => 'required|string|max:1000',
        ]);

        // Verify user is in group
        if (!$group->users->contains(auth()->id())) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $message = GroupMessage::create([
            'group_id' => $group->id,
            'user_id' => auth()->id(),
            'content' => $validated['content'],
        ]);

        // Load the message with user information
        $message->load('user:id,name,username,avatar');

        return response()->json([
            'message' => array_merge($message->toArray(), [
                'created_at' => $message->created_at->toISOString(),
            ])
        ]);
    }

    public function getGroupMessages(Group $group)
    {
        // Verify user is in group
        if (!$group->users->contains(auth()->id())) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $messages = $group->messages()
            ->with('user:id,name,username,avatar')
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
}
