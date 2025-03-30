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
        $posts = Post::with(['user:id,name,username,avatar,verification_status', 'attachments', 'likes', 'comments' => function($query) {
            $query->with('user:id,name,username,avatar,verification_status');
        }])->latest()->get()->map(function ($post) use ($user) {
            $post->user = (object) array_merge((array) $post->user, ['is_friend' => $user->isFriendsWith($post->user)]);
            return $post;
        });

        return Inertia::render('dashboard', [
            'posts' => $posts
        ]);
    }
}
