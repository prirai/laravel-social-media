<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Message;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use App\Models\Group;
use App\Models\GroupMessage;
use Illuminate\Support\Facades\Storage;
use App\Models\MessageAttachment;
use App\Models\GroupMessageAttachment;

class MessagingController extends Controller
{
    /**
     * Display the messaging interface.
     */
    public function index()
    {
        $currentUser = auth()->user();
        
        // Get users with their last direct message
        $users = User::where('id', '!=', $currentUser->id)
            ->get()
            ->map(function($user) use ($currentUser) {
                // Get the last message between the current user and this user
                $lastMessage = Message::where(function($query) use ($currentUser, $user) {
                        $query->where('sender_id', $currentUser->id)
                              ->where('receiver_id', $user->id);
                    })
                    ->orWhere(function($query) use ($currentUser, $user) {
                        $query->where('sender_id', $user->id)
                              ->where('receiver_id', $currentUser->id);
                    })
                    ->latest()
                    ->first();
                
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'username' => $user->username,
                    'avatar' => $user->avatar,
                    'verification_status' => $user->verification_status,
                    'public_key' => $user->public_key,
                    'lastMessage' => $lastMessage ? $lastMessage->content : null,
                    'lastMessageTime' => $lastMessage ? $lastMessage->created_at->diffForHumans() : null,
                    'unreadCount' => 0,
                    'isCurrentUser' => $user->id === $currentUser->id,
                    'isFriend' => $currentUser->friends->contains($user->id)
                ];
            });
        
        // Get groups with their last message
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
            'allUsers' => User::where('id', '!=', $currentUser->id)->select('id', 'name', 'username', 'avatar', 'verification_status', 'public_key')->get()
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
        ->active() // Only get non-expired messages
        ->with(['sender:id,name,username,avatar', 'attachments'])
        ->orderBy('created_at', 'asc')
        ->get()
        ->map(function ($message) {
            return array_merge($message->toArray(), [
                'created_at' => $message->created_at->toISOString(),
                'expires_at' => $message->expires_at->toISOString(),
            ]);
        });

        return response()->json([
            'messages' => $messages,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'username' => $user->username,
                'avatar' => $user->avatar,
                'verification_status' => $user->verification_status,
                'public_key' => $user->public_key,
            ]
        ]);
    }

    /**
     * Send a message to a user.
     */
    public function sendMessage(Request $request, $userId)
    {
        try {
            $validated = $request->validate([
                'content' => 'required|string',
                'is_encrypted' => 'nullable',
                'attachments.*' => 'nullable|file|mimes:jpeg,png,jpg,gif,pdf,mp4,mp3,wav|max:5120', // 5MB max
            ], [
                'attachments.*.max' => 'Each file must be less than 5MB.',
                'attachments.*.mimes' => 'Only JPEG, PNG, JPG, GIF, PDF, MP4, MP3, and WAV files are allowed.',
            ]);

            // Handle is_encrypted as a boolean value, regardless of the input format
            $isEncrypted = filter_var($request->input('is_encrypted', false), FILTER_VALIDATE_BOOLEAN);

            $message = Message::create([
                'sender_id' => auth()->id(),
                'receiver_id' => $userId,
                'content' => $validated['content'],
                'is_encrypted' => $isEncrypted,
            ]);

            if ($request->hasFile('attachments')) {
                foreach ($request->file('attachments') as $file) {
                    $path = $file->store('message-attachments/' . auth()->id(), 'public');

                    MessageAttachment::create([
                        'message_id' => $message->id,
                        'file_path' => Storage::url($path),
                        'file_type' => $file->getMimeType(),
                        'file_name' => $file->getClientOriginalName(),
                        'file_size' => $file->getSize(),
                    ]);
                }
            }

            // Load the message with sender information and attachments
            $message->load(['attachments', 'sender:id,name,username,avatar,verification_status']);
            
            // Format dates for consistency with other API responses
            $formattedMessage = array_merge($message->toArray(), [
                'created_at' => $message->created_at->toISOString(),
                'expires_at' => $message->expires_at->toISOString(),
            ]);

            return response()->json([
                'success' => true,
                'message' => $formattedMessage
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to send message: ' . $e->getMessage()
            ], 500);
        }
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
            'attachments.*' => 'nullable|file|mimes:jpeg,png,jpg,gif,pdf,mp4,mp3,wav|max:5120', // 5MB max
        ], [
            'attachments.*.max' => 'Each file must be less than 5MB.',
            'attachments.*.mimes' => 'Only JPEG, PNG, JPG, GIF, PDF, MP4, MP3, and WAV files are allowed.',
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

        if ($request->hasFile('attachments')) {
            foreach ($request->file('attachments') as $file) {
                $path = $file->store('message-attachments/' . auth()->id(), 'public');

                GroupMessageAttachment::create([
                    'group_message_id' => $message->id,
                    'file_path' => Storage::url($path),
                    'file_type' => $file->getMimeType(),
                    'file_name' => $file->getClientOriginalName(),
                    'file_size' => $file->getSize(),
                ]);
            }
        }

        // Load the message with user information and attachments
        $message->load(['user:id,name,username,avatar,verification_status', 'attachments']);

        return response()->json([
            'message' => [
                'id' => $message->id,
                'content' => $message->content,
                'user_id' => $message->user_id,
                'created_at' => $message->created_at->toISOString(),
                'user' => $message->user,
                'attachments' => $message->attachments,
            ]
        ]);
    }

    public function getGroupMessages(Group $group)
    {
        // Verify user is in group
        if (!$group->users->contains(auth()->id())) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $messages = $group->messages()
            ->with(['user:id,name,username,avatar,verification_status', 'attachments'])
            ->orderBy('created_at', 'asc')
            ->get()
            ->map(function ($message) {
                return [
                    'id' => $message->id,
                    'content' => $message->content,
                    'user_id' => $message->user_id,
                    'created_at' => $message->created_at->toISOString(),
                    'user' => [
                        'id' => $message->user->id,
                        'name' => $message->user->name,
                        'username' => $message->user->username,
                        'avatar' => $message->user->avatar,
                        'verification_status' => $message->user->verification_status,
                    ],
                    'attachments' => $message->attachments,
                ];
            });

        return response()->json([
            'messages' => $messages
        ]);
    }

    /**
     * Delete a direct message and its attachments.
     */
    public function destroy(Message $message)
    {
        // Check if the authenticated user is the sender of the message
        if ($message->sender_id !== auth()->id()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        // Delete any attachments associated with the message
        if ($message->attachments) {
            foreach ($message->attachments as $attachment) {
                // Remove the storage prefix from the file path
                $filePath = str_replace('storage/', '', $attachment->file_path);
                Storage::disk('public')->delete($filePath);
                $attachment->delete();
            }
        }

        // Delete the message
        $message->delete();

        return back();
    }

    /**
     * Delete a group message and its attachments.
     */
    public function destroyGroupMessage(GroupMessage $groupMessage)
    {
        // Check if the authenticated user is the sender of the message
        if ($groupMessage->user_id !== auth()->id()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        // Delete any attachments associated with the message
        if ($groupMessage->attachments) {
            foreach ($groupMessage->attachments as $attachment) {
                // Remove the storage prefix from the file path
                $filePath = str_replace('storage/', '', $attachment->file_path);
                Storage::disk('public')->delete($filePath);
                $attachment->delete();
            }
        }

        // Delete the message
        $groupMessage->delete();

        return back();
    }
}
