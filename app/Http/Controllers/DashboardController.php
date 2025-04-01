<?php

namespace App\Http\Controllers;

use App\Models\Post;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $user = auth()->user();
        $posts = Post::with(['user:id,name,username,avatar,verification_status', 'likes', 'comments' => function($query) {
            $query->with('user:id,name,username,avatar,verification_status');
        }])->latest()->get()->map(function ($post) use ($user) {
            // Format the post data
            $formattedPost = [
                'id' => $post->id,
                'content' => $post->content,
                'created_at' => $post->created_at,
                'user' => array_merge((array) $post->user->toArray(), ['is_friend' => $user->isFriendsWith($post->user)]),
                'likes' => $post->likes,
                'comments' => $post->comments,
                'attachments' => []
            ];
            
            // Get attachments directly from the database
            $attachments = \DB::table('attachments')
                ->where('post_id', $post->id)
                ->get(['id', 'file_path', 'file_type']);
                
            // Add attachments to the post
            $formattedPost['attachments'] = $attachments->map(function($attachment) {
                return [
                    'id' => $attachment->id,
                    'file_path' => $attachment->file_path,
                    'file_type' => $attachment->file_type
                ];
            })->toArray();
            
            return $formattedPost;
        });

        return Inertia::render('dashboard', [
            'posts' => $posts
        ]);
    }
}
