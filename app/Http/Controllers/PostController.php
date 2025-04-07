<?php

namespace App\Http\Controllers;

use App\Models\Post;
use App\Models\Attachment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use App\Models\Like;
use App\Models\Comment;

class PostController extends Controller
{
    public function store(Request $request)
    {
        // Check if user is verified
        // if (auth()->user()->verification_status !== 'verified') {
        //     return back()->with('error', 'Only verified users can create posts.');
        // }
        if (!auth()->user()->hasVerifiedEmail()) {
            return back()->with('error', 'You must verify your email to create a post.');
        }

        $validated = $request->validate([
                'content' => 'required|string',
                'attachments.*' => 'nullable|file|mimes:jpeg,png,jpg,gif,pdf|max:5120', // 5MB max
            ], [
                'attachments.*.max' => 'Each file must be less than 5MB.',
                'attachments.*.mimes' => 'Only JPEG, PNG, JPG, GIF and PDF files are allowed.',
            ]);

        $post = Post::create([
            'content' => $validated['content'],
            'user_id' => auth()->id(),
        ]);

        if ($request->hasFile('attachments')) {
            foreach ($request->file('attachments') as $file) {
                $path = $file->store('attachments/' . auth()->id(), 'public');

                Attachment::create([
                    'post_id' => $post->id,
                    'file_path' => Storage::url($path),
                    'file_type' => $file->getMimeType(),
                    'file_name' => $file->getClientOriginalName(),
                    'file_size' => $file->getSize(),
                ]);
            }
        }

        // Load the post with its relationships and add is_friend property
        $post->load(['user:id,name,username,avatar,verification_status', 'attachments', 'likes', 'comments' => function($query) {
            $query->with('user:id,name,username');
        }]);
        
        $post->user = (object) array_merge((array) $post->user, ['is_friend' => auth()->user()->isFriendsWith($post->user)]);

        return back()->with('post', $post);
    }

    public function like(Request $request, Post $post)
    {
        $existingLike = Like::where('user_id', auth()->id())->where('post_id', $post->id)->first();

        if ($existingLike) {
            $existingLike->delete();
            $liked = false;
        } else {
            Like::create([
                'user_id' => auth()->id(),
                'post_id' => $post->id,
            ]);
            $liked = true;
        }

        // Return JSON response with updated like count
        return response()->json([
            'success' => true,
            'liked' => $liked,
            'likes_count' => $post->likes()->count(),
        ]);
    }


    public function comment(Request $request, Post $post)
    {
        $validated = $request->validate([
            'content' => 'required|string',
        ]);

        $comment = Comment::create([
            'user_id' => auth()->id(),
            'post_id' => $post->id,
            'content' => $validated['content'],
        ]);

        // Load the comment with its user data
        $comment->load(['user' => function($query) {
            $query->select('id', 'name', 'username', 'avatar', 'verification_status');
        }]);

        // Return an Inertia response
        return back()->with('comment', $comment);
    }

    public function index()
    {
        $posts = Post::with(['user' => function($query) {
                    $query->select('id', 'name', 'username', 'avatar', 'verification_status');
                }, 'comments.user' => function ($query) {
                    $query->select('id', 'user_id', 'post_id', 'content', 'created_at')
                          ->with(['user' => function ($userQuery) {
                              $userQuery->select('id', 'name', 'username', 'avatar', 'verification_status');
                          }]);
                }])->latest()->get();


        return inertia('dashboard', [
            'posts' => $posts,
        ]);
    }

    public function destroy(Post $post)
    {
        // Check if user owns the post
        if ($post->user_id !== auth()->id()) {
            abort(403);
        }

        $post->delete();
        return back();
    }

    public function destroyComment(Comment $comment)
    {
        // Check if user owns the comment
        if ($comment->user_id !== auth()->id()) {
            abort(403);
        }

        $comment->delete();
        return back();
    }
}
