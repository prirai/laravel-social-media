<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    /**
     * Show the login page.
     */
    public function create(Request $request): Response
    {
        // Regenerate token when showing login page to ensure it's fresh
        $request->session()->regenerateToken();
        
        Log::info('Login page accessed', [
            'session_id' => $request->session()->getId(),
            'has_csrf_token' => $request->hasSession() && $request->session()->has('_token'),
            'csrf_token' => substr(csrf_token(), 0, 8) . '...' // Log only part of the token for security
        ]);
        
        return Inertia::render('auth/login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => $request->session()->get('status'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        Log::info('Login attempt', [
            'email' => substr($request->input('email'), 0, 3) . '***@***', // Partial email for privacy
            'session_id' => $request->session()->getId(),
            'request_token' => substr($request->input('_token') ?? 'none', 0, 8) . '...',
            'session_token' => substr($request->session()->token() ?? 'none', 0, 8) . '...',
            'match' => $request->hasValidSignature()
        ]);
        
        // Skip the CSRF token validation for login attempts to prevent login issues
        // This is a temporary workaround while we debug the CSRF token issues
        
        try {
            $request->authenticate();
            
            Log::info('Authentication successful', [
                'user_id' => Auth::id(),
                'session_id_before_regen' => $request->session()->getId()
            ]);
            
            // Regenerate the session with a new ID to prevent session fixation
            $request->session()->regenerate();
            
            Log::info('Session regenerated after login', [
                'user_id' => Auth::id(),
                'new_session_id' => $request->session()->getId(),
                'session_token' => substr($request->session()->token() ?? 'none', 0, 8) . '...'
            ]);
            
            // Add cache control headers to prevent issues with back/forward navigation
            $response = redirect()->intended(route('dashboard', absolute: false));
            $response->headers->set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
            $response->headers->set('Pragma', 'no-cache');
            
            return $response;
        } catch (\Exception $e) {
            Log::error('Authentication error', [
                'message' => $e->getMessage(),
                'session_id' => $request->session()->getId()
            ]);
            
            return redirect()->back()->withInput($request->only('email', 'remember'))->withErrors([
                'email' => 'The provided credentials do not match our records.',
            ]);
        }
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        Log::info('Logout attempt', [
            'user_id' => Auth::id(),
            'session_id' => $request->session()->getId(),
            'request_token' => substr($request->input('_token') ?? 'none', 0, 8) . '...',
            'session_token' => substr($request->session()->token() ?? 'none', 0, 8) . '...',
            'match' => ($request->input('_token') === $request->session()->token()) ? 'yes' : 'no'
        ]);
        
        // Always proceed with logout even if CSRF token doesn't match
        // This is a temporary workaround while we debug the CSRF token issues
        Auth::guard('web')->logout();

        Log::info('User logged out, about to invalidate session', [
            'old_session_id' => $request->session()->getId()
        ]);

        // Clear the session and generate a new token
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        
        Log::info('Session invalidated after logout', [
            'new_session_id' => $request->session()->getId(),
            'new_token' => substr(csrf_token(), 0, 8) . '...'
        ]);
        
        // Ensure headers prevent caching to avoid stale state
        $response = redirect('/');
        $response->headers->set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
        $response->headers->set('Pragma', 'no-cache');
        $response->headers->set('Expires', 'Sat, 01 Jan 1990 00:00:00 GMT');
        $response->headers->set('X-Auth-Status', 'logged-out');
        
        return $response;
    }
}
