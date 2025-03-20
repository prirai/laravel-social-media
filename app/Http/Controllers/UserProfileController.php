<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class UserProfileController extends Controller
{
    public function update(Request $request): RedirectResponse
        {
            $user = Auth::user();

            try {
                exception
                $validatedData = $request->validate([ // Changed to $request->validate()
            'name' => 'required|string|max:255',
            'username' => 'required|string|alpha_dash|max:255|unique:users,username,' . auth()->id(),
            'email' => 'required|string|lowercase|email|max:255|unique:users,email,' . auth()->id(),
            'new_avatar' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            ]);

            $user->name = $validatedData['name']; // Use validated data array
            $user->username = $validatedData['username']; // Use validated data array
            $user->email = $validatedData['email']; // Use validated data array


            if ($request->hasFile('new_avatar')) {
                if ($user->avatar) {
                    Storage::disk('public')->delete($user->avatar);
                }

                $avatarPath = $request->file('new_avatar')->store('avatars', 'public');
                $user->avatar = $avatarPath;
            }

            $user->save();
            } catch (\Illuminate\Validation\ValidationException $e) {
                \Log::error('Validation errors: ' . $e->errors());
                return back()->withErrors($e->errors());
            }

            return redirect()->back()->with('success', 'Profile updated successfully!');
        }
}
