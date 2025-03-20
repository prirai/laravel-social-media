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

        return redirect()->back();
    }

    public function like(Request $request, Post $post)
    {
        $existingLike = Like::where('user_id', auth()->id())->where('post_id', $post->id)->first();

        if ($existingLike) {
            $existingLike->delete();
        } else {
            Like::create([
                'user_id' => auth()->id(),
                'post_id' => $post->id,
            ]);
        }

        return redirect()->back();
    }


    public function comment(Request $request, Post $post)
    {
        $validated = $request->validate([
            'content' => 'required|string',
        ]);

        Comment::create([
            'user_id' => auth()->id(),
            'post_id' => $post->id,
            'content' => $validated['content'],
        ]);

        return redirect()->back();
    }
}
