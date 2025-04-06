<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\ProfileUpdateRequest;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\DB;

class ProfileController extends Controller
{

    public function edit(Request $request): Response
    {
        return Inertia::render('settings/profile', [
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status' => $request->session()->get('status'),
        ]);
    }

    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $user = $request->user();
        $validated = $request->validated();

        if ($request->hasFile('new_avatar')) {
            if ($user->avatar) {
                Storage::disk('public')->delete($user->avatar);
            }
            $validated['avatar'] = $request->file('new_avatar')->store('avatars', 'public');
        }

        $user->update($validated);

        return to_route('profile.edit')->with('success', 'Profile updated successfully!');
    }


    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        // Begin a database transaction
        DB::beginTransaction();
        
        try {
            // Handle groups created by this user
            \App\Models\Group::where('created_by', $user->id)->update([
                'created_by' => null
            ]);
            
            // Clean up group memberships
            DB::table('group_user')->where('user_id', $user->id)->delete();
            
            // Handle posts (either delete them or set a placeholder user)
            // Option 1: Delete posts and their associated data
            $user->posts()->each(function ($post) {
                // Delete post likes
                $post->likes()->delete();
                
                // Delete post comments
                $post->comments()->delete();
                
                // Delete post attachments
                $post->attachments()->delete();
                
                // Delete the post
                $post->delete();
            });
            
            // Delete user's likes
            $user->likes()->delete();
            
            // Delete user's comments
            $user->comments()->delete();
            
            // Delete user's messages
            DB::table('messages')
                ->where('sender_id', $user->id)
                ->orWhere('receiver_id', $user->id)
                ->delete();
                
            // Delete user's group messages
            $user->groupMessages()->delete();
            
            // Delete friendships
            DB::table('friendships')
                ->where('user_id', $user->id)
                ->orWhere('friend_id', $user->id)
                ->delete();
                
            // Delete notifications
            DB::table('notifications')
                ->where('user_id', $user->id)
                ->orWhere('from_user_id', $user->id)
                ->delete();
                
            // Delete verification documents
            $user->verificationDocuments()->delete();
            
            // Logout the user
            Auth::logout();
            
            // Delete the user
            $user->delete();
            
            // Commit transaction
            DB::commit();
            
            // Invalidate session
            $request->session()->invalidate();
            $request->session()->regenerateToken();
            
            return redirect('/');
            
        } catch (\Exception $e) {
            // Roll back transaction on error
            DB::rollBack();
            
            return back()->withErrors(['delete_error' => 'Error deleting account: ' . $e->getMessage()]);
        }
    }
}
