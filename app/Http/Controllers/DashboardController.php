<?php

namespace App\Http\Controllers;

use App\Models\Post;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
        {
            $posts = Post::with(['user:id,name,username,avatar', 'attachments', 'likes', 'comments' => function($query) {
                $query->with('user:id,name,username');
            }])->latest()->get();

            return Inertia::render('dashboard', [
                'posts' => $posts
            ]);
        }
}
