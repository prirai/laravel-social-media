<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\UserReport;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProfileController extends Controller
{
    public function show($username)
    {
        $user = User::where('username', $username)
            ->with([
                'posts' => function ($query) {
                $query->latest()->with(['user', 'likes', 'comments.user']);
            }])
            ->firstOrFail();

        return Inertia::render('profile/show', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'username' => $user->username,
                'avatar' => $user->avatar,
                'verification_status' => $user->verification_status,
                'posts' => $user->posts
            ],
            'isOwnProfile' => auth()->id() === $user->id
        ]);
    }

    public function report(Request $request, $username)
    {
        $user = User::where('username', $username)->firstOrFail();

        $validated = $request->validate([
            'reason' => 'required|string|max:1000'
        ]);

        UserReport::create([
            'reported_user_id' => $user->id,
            'reporter_id' => auth()->id(),
            'reason' => $validated['reason']
        ]);

        return back()->with('success', 'Report submitted successfully');
    }
}
