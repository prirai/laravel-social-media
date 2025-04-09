<?php

namespace App\Exceptions;

use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Illuminate\Session\TokenMismatchException;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Throwable;

class Handler extends ExceptionHandler
{
    /**
     * The list of the inputs that are never flashed to the session on validation exceptions.
     *
     * @var array<int, string>
     */
    protected $dontFlash = [
        'current_password',
        'password',
        'password_confirmation',
    ];

    /**
     * Register the exception handling callbacks for the application.
     */
    public function register(): void
    {
        $this->reportable(function (Throwable $e) {
            //
        });

        // Handle token mismatch (CSRF) errors
        $this->renderable(function (TokenMismatchException $e, $request) {
            // Log detailed information about the TokenMismatchException
            Log::warning('TokenMismatchException handled in exception handler', [
                'path' => $request->path(),
                'method' => $request->method(),
                'session_id' => $request->session()->getId(),
                'has_token' => $request->hasSession() && $request->session()->has('_token') ? 'yes' : 'no',
                'token_regenerated' => 'yes', // We're about to regenerate it
                'referer' => $request->header('referer'),
                'user_agent' => $request->userAgent(),
                'url' => $request->fullUrl(),
                'is_ajax' => $request->ajax() ? 'yes' : 'no'
            ]);
            
            // Always regenerate a new token when a mismatch occurs
            $request->session()->regenerateToken();
            
            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'Your session has expired. Please refresh and try again.'
                ], 419);
            }
            
            // Redirect to login with a clearer message about the CSRF token mismatch
            return redirect()->route('login')
                ->with('status', 'Your session has expired due to inactivity. Please log in again.');
        });
    }
} 