<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Mail;
use Illuminate\Auth\Events\Verified;
use Inertia\Inertia;

// For searches
class UserController extends Controller
{
    public function search(Request $request)
    {
        $query = $request->input('query');
        
        if (strlen($query) < 2) {
            return response()->json(['users' => []]);
        }

        $users = User::where('username', 'like', "%{$query}%")
            ->orWhere('name', 'like', "%{$query}%")
            ->select('id', 'name', 'username', 'avatar')
            ->limit(10)
            ->get();

        return response()->json(['users' => $users]);
    }

    /**
     * Send an OTP to the user's email for verification
     */
    public function sendEmailOtp(Request $request)
    {
        $user = $request->user();
        
        if ($user->hasVerifiedEmail()) {
            return redirect()->back()->with('error', 'Email already verified');
        }
        
        // Generate a 6-digit OTP
        $otp = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        
        // Store OTP in cache with expiry time of 5 minutes
        $cacheKey = 'email_verify_otp_' . $user->id;
        Cache::put($cacheKey, $otp, now()->addMinutes(5));
        
        // Send OTP to the user's email
        try {
            Mail::to($user->email)->send(new \App\Mail\EmailVerificationOtp($user, $otp));
            return redirect()->back()->with('success', 'OTP sent successfully');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Failed to send OTP: ' . $e->getMessage());
        }
    }
    
    /**
     * Verify user's email with OTP
     */
    public function verifyEmailWithOtp(Request $request)
    {
        $validated = $request->validate([
            'otp' => 'required|string|size:6',
        ]);
        
        $user = $request->user();
        
        if ($user->hasVerifiedEmail()) {
            return redirect()->back()->with('error', 'Email already verified');
        }
        
        $cacheKey = 'email_verify_otp_' . $user->id;
        $storedOtp = Cache::get($cacheKey);
        
        if (!$storedOtp || $storedOtp !== $validated['otp']) {
            return redirect()->back()->withErrors(['otp' => 'Invalid OTP']);
        }
        
        if ($user->markEmailAsVerified()) {
            event(new Verified($user));
            Cache::forget($cacheKey);
            return redirect()->route('dashboard')->with('success', 'Email verified successfully');
        }
        
        return redirect()->back()->with('error', 'Failed to verify email');
    }

    /**
     * Update user's public key for encrypted messaging
     */
    public function updatePublicKey(Request $request)
    {
        $validated = $request->validate([
            'public_key' => 'required|string',
        ]);
        
        $user = $request->user();
        $user->public_key = $validated['public_key'];
        $user->save();
        
        return response()->json([
            'success' => true,
            'message' => 'Public key updated successfully'
        ]);
    }

    /**
     * Send an OTP to an email for password reset verification
     * This method doesn't require authentication
     */
    public function sendPasswordResetOtp(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
        ]);
        
        // Check if user exists
        $user = User::where('email', $validated['email'])->first();
        
        if (!$user) {
            // We don't want to reveal if an email exists or not for security reasons
            // Return success even if user doesn't exist
            return response()->json(['message' => 'If your email exists in our system, we\'ll send a verification code.']);
        }
        
        // Generate a 6-digit OTP
        $otp = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        
        // Store OTP in cache with expiry time of 5 minutes
        $cacheKey = 'password_reset_otp_' . $validated['email'];
        Cache::put($cacheKey, $otp, now()->addMinutes(5));
        
        // Send OTP to the user's email
        try {
            Mail::to($validated['email'])->send(new \App\Mail\PasswordResetOtp($user, $otp));
            return response()->json(['message' => 'Verification code sent successfully']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to send verification code'], 500);
        }
    }

    /**
     * Verify OTP for password reset (no authentication required)
     */
    public function verifyPasswordResetOtp(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'otp' => 'required|string|size:6',
        ]);
        
        $cacheKey = 'password_reset_otp_' . $validated['email'];
        $storedOtp = Cache::get($cacheKey);
        
        if (!$storedOtp || $storedOtp !== $validated['otp']) {
            return response()->json(['errors' => ['otp' => ['Invalid verification code']]], 422);
        }
        
        // OTP is valid, clear it from cache
        Cache::forget($cacheKey);
        
        // Return success
        return response()->json(['message' => 'OTP verified successfully']);
    }

    /**
     * Reset password directly after OTP verification
     * This method doesn't require authentication
     */
    public function resetPasswordAfterOtp(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'password' => 'required|min:8|confirmed',
        ]);
        
        // Check if user exists
        $user = User::where('email', $validated['email'])->first();
        
        if (!$user) {
            return response()->json(['errors' => ['email' => ['User not found']]], 422);
        }
        
        // Update the password
        $user->password = bcrypt($validated['password']);
        $user->save();
        
        // Return success
        return response()->json([
            'message' => 'Password has been reset successfully'
        ]);
    }
} 