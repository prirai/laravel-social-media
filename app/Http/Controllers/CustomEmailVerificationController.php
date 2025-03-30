<?php

// namespace App\Http\Controllers\Auth;

// use App\Http\Controllers\Controller;
// use Illuminate\Http\Request;
// use Illuminate\Support\Facades\Auth;
// use Illuminate\Support\Facades\URL;
// use Illuminate\Support\Facades\Mail;
// use Illuminate\Support\Carbon;
// use Illuminate\Auth\Events\Verified;
// use Illuminate\Http\RedirectResponse;

// class EmailVerificationController extends Controller
// {
//     /**
//      * Send a verification email to the authenticated user.
//      */
//     public function submit(Request $request): RedirectResponse
//     {
//         $user = $request->user();

//         if ($user->hasVerifiedEmail()) {
//             return back()->with('status', 'Your email is already verified.');
//         }

//         // Create a signed verification URL (valid for 60 minutes)
//         $verificationUrl = URL::temporarySignedRoute(
//             'verification.verify',
//             Carbon::now()->addMinutes(60),
//             ['id' => $user->id, 'hash' => sha1($user->email)]
//         );

//         // Send the email
//         Mail::to($user->email)->send(new \App\Mail\VerifyEmail($user, $verificationUrl));

//         return back()->with('status', 'A verification link has been sent to your email.');
//     }
// }

namespace App\Http\Controllers;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use App\Http\Controllers\Controller;

class CustomEmailVerificationController extends Controller
{
    public function submit(Request $request): RedirectResponse
    {
        $user = $request->user();

        if ($user->hasVerifiedEmail()) {
            return back()->with('status', 'Your email is already verified.');
        }

        // This is Laravel's built-in magic ✨
        $user->sendEmailVerificationNotification();

        return back()->with('status', 'Verification link sent!');
    }
}
