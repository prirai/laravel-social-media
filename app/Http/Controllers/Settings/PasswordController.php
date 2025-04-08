<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password; // Already correctly imported
use Inertia\Inertia;
use Inertia\Response;

class PasswordController extends Controller
{
    /**
     * Show the user's password settings page.
     */
    public function edit(Request $request): Response
    {
        // No changes needed here
        return Inertia::render('settings/password', [
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status' => $request->session()->get('status'),
        ]);
    }

    /**
     * Update the user's password.
     */
    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validateWithBag('updatePassword', [ // Good practice to use an error bag
            'current_password' => ['required', 'current_password'],
            'password' => [
                'required',
                'confirmed', // Keep confirmed rule
                Password::min(10)       // Minimum 10 characters
                    ->mixedCase()     // Requires both uppercase and lowercase
                    ->numbers()       // Requires at least one number
                    ->symbols()       // Requires at least one special character
                   // ->uncompromised(), // Optional: Check against pwned passwords DB
            ],
            // 'password_confirmation' is implicitly required by 'confirmed'
        ]);

        $request->user()->update([
            'password' => Hash::make($validated['password']),
        ]);

        // Return back with a status message for the frontend Transition
        return back()->with('status', 'password-updated');
    }
}
