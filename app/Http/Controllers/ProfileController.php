<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\UserReport;
use App\Models\FriendRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage; // <-- Import Storage facade
use Illuminate\Validation\Rule; // <-- Import Rule facade
use Inertia\Inertia;

class ProfileController extends Controller
{
    // --- show method remains the same ---
    public function show(string $username)
    {
        $user = User::where('username', $username)
            ->with([
                'posts' => function ($query) {
                    $query->orderBy('created_at', 'desc'); // Order posts
                },
                'posts.user',
                'posts.likes',
                'posts.comments' => function ($query) {
                     $query->orderBy('created_at', 'asc'); // Order comments
                },
                'posts.comments.user',
                'posts.attachments'
             ])
            ->firstOrFail();

        $isOwnProfile = auth()->check() && auth()->id() === $user->id;

        $friendRequest = null;
        $isFriend = false;
        $friends = [];

        if (auth()->check()) {
            $authUserId = auth()->id();
            if (!$isOwnProfile) {
                $isFriend = auth()->user()->isFriendsWith($user);

                $friendRequest = FriendRequest::where(function ($query) use ($user, $authUserId) {
                    $query->where('sender_id', $authUserId)
                          ->where('receiver_id', $user->id);
                })->orWhere(function ($query) use ($user, $authUserId) {
                    $query->where('sender_id', $user->id)
                          ->where('receiver_id', $authUserId);
                })->first();
            }

            $friends = $user->friends()
                ->select('users.id', 'users.name', 'users.username', 'users.avatar', 'users.verification_status')
                ->get();
        }

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
                    'user' => $post->user ? [
                        'name' => $post->user->name,
                        'username' => $post->user->username,
                        'avatar' => $post->user->avatar,
                        'verification_status' => $post->user->verification_status,
                    ] : null, // Add null check for user
                    'likes' => $post->likes ?? [],
                    'comments' => $post->comments->map(function($comment) {
                        return [
                            'id' => $comment->id,
                            'content' => $comment->content,
                            'created_at' => $comment->created_at,
                            'user' => $comment->user ? [
                                'id' => $comment->user->id,
                                'name' => $comment->user->name,
                                'username' => $comment->user->username,
                                'avatar' => $comment->user->avatar,
                                'verification_status' => $comment->user->verification_status,
                            ] : null, // Add null check for comment user
                        ];
                    }) ?? [],
                    'attachments' => $post->attachments ?? [],
                ];
            }),
            'is_friend' => $isFriend,
            'friends' => $friends,
        ];

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
            // Pass report categories to the frontend
            'reportCategories' => UserReport::CATEGORIES,
        ]);
    }


    public function report(Request $request, $username)
    {
        $reportedUser = User::where('username', $username)->firstOrFail();
        $reporterId = auth()->id();

        // Prevent reporting self
        if ($reportedUser->id === $reporterId) {
             return back()->withErrors(['reason' => 'You cannot report yourself.']);
        }

        $validated = $request->validate([
            'category' => ['required', 'string', Rule::in(array_keys(UserReport::CATEGORIES))], // Validate against defined categories
            'reason' => 'required|string|max:2000', // Increased max length slightly
            'attachment' => 'nullable|file|mimes:jpg,jpeg,png,pdf,doc,docx|max:5120', // Optional file, specific types, max 5MB
        ]);

        $attachmentPath = null;
        if ($request->hasFile('attachment') && $request->file('attachment')->isValid()) {
            // Store the file in 'public/report_attachments' directory
            // The Storage::url() helper will generate the correct URL if storage is linked
            $attachmentPath = $request->file('attachment')->store('report_attachments', 'public');
        }

        UserReport::create([
            'reported_user_id' => $reportedUser->id,
            'reporter_id' => $reporterId,
            'category' => $validated['category'],
            'reason' => $validated['reason'],
            'attachment_path' => $attachmentPath,
            'status' => 'pending' // Explicitly set status if needed
        ]);

        // Use Inertia flash message for better integration
        return back()->with('success', 'Report submitted successfully.');
    }
}
