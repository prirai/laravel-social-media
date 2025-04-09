<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Models\AccessLog;
use Jenssegers\Agent\Agent;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpKernel\Exception\HttpException; // Optional, but good practice
use Illuminate\Support\Facades\Cookie;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\Auth\AuthenticatedSessionController;


class LogAccessMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        Log::debug('LogAccessMiddleware: Running for path: ' . $request->path());

        // --- Get IP Address FIRST ---
        $clientIp = $request->header('X-Real-IP') ?? $request->ip();

        // --- Perform Blocking Check BEFORE the try...catch ---
        $isBlocked = AccessLog::where('ip_address', $clientIp)
                              ->where('is_blocked', true)
                              ->exists();

        if ($isBlocked) {
            // Log the attempt BEFORE aborting
            Log::warning('Blocked IP access attempt detected', [
                'ip' => $clientIp,
                'url' => $request->fullUrl(),
                'user_agent' => $request->userAgent()
            ]);
            
            // Create an exception for the view
            $exception = new AccessDeniedHttpException('Your IP address has been blocked from accessing this site.');
            
            // If user is authenticated, log them out
            if (Auth::check()) {
                $authController = new AuthenticatedSessionController();
                $authController->destroy($request);
            }
            
            // Create a response with the 403 view
            $response = response()->view('errors.403', [
                'exception' => $exception,
                'message' => 'Access Denied',
                'ip' => $clientIp
            ], 403);
            
            // Add security headers to prevent caching
            $response->headers->set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
            $response->headers->set('Pragma', 'no-cache');
            $response->headers->set('Expires', 'Sat, 01 Jan 1990 00:00:00 GMT');
            
            return $response;
        }

        // --- Now, try to log details, but catch specific errors if needed ---
        try {
            // Get user agent information
            $agent = new Agent();
            $agent->setUserAgent($request->userAgent());

            // Determine if this is an admin attempt
            $adminPrefix = config('backpack.base.route_prefix', 'admin');
            $isAdminAttempt = $request->is($adminPrefix) || $request->is($adminPrefix . '/*');
            $isHoneypot = $request->is('admin') || $request->is('admin/*');

            // Prepare log data
            $browser = $agent->browser();
            $platform = $agent->platform();
            $url = $request->fullUrl();
            
            // Check if a matching record already exists
            $existingLog = AccessLog::where('ip_address', $clientIp)
                ->where('url', $url)
                ->where('browser', $browser)
                ->where('platform', $platform)
                ->first();
                
            if ($existingLog) {
                // Increment the visit count for an existing record
                $existingLog->increment('visit_count');
                
                // Update the timestamp
                $existingLog->touch();
                
                // If this is a honeypot access, log it
                if ($isHoneypot && !$isAdminAttempt) {
                    Log::warning('Honeypot access attempt detected (repeat visit)', [
                        'ip' => $clientIp, 
                        'url' => $url,
                        'user_agent' => $request->userAgent(),
                        'visit_count' => $existingLog->visit_count
                    ]);
                }
            } else {
                // Create new log entry for a unique combination
                AccessLog::create([
                    'ip_address' => $clientIp,
                    'user_agent' => $request->userAgent(),
                    'url' => $url,
                    'method' => $request->method(),
                    'referer' => $request->header('referer'),
                    'is_admin_attempt' => $isAdminAttempt || $isHoneypot,
                    'is_blocked' => false, // We already know it's not blocked if we reach here
                    'request_data' => $request->all(), // Consider redacting sensitive data
                    'browser' => $browser,
                    'platform' => $platform,
                    'device' => $agent->device(),
                    'visit_count' => 1,
                ]);
                
                // If it's a honeypot attempt, log it
                if ($isHoneypot && !$isAdminAttempt) {
                    Log::warning('Honeypot access attempt detected (first visit)', [
                        'ip' => $clientIp, 
                        'url' => $url,
                        'user_agent' => $request->userAgent()
                    ]);
                }
            }
        } catch (\Exception $e) {
            // Log unexpected errors during detail gathering, but DON'T catch HttpExceptions here
            Log::error('Error gathering details in LogAccessMiddleware (IP: '.$clientIp.'): ' . $e->getMessage(), ['exception' => $e]);
            // Allow the request to proceed even if detail logging fails
        }

        // --- Proceed with the request pipeline ---
        return $next($request);
    }
}
