<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Models\AccessLog;
use Jenssegers\Agent\Agent;
use Stevebauman\Location\Facades\Location;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpKernel\Exception\HttpException; // Optional, but good practice


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
            // Abort the request - this will throw an HttpException
            abort(403, 'Unauthorized');
        }

        // --- Now, try to log details, but catch specific errors if needed ---
        try {
            // Get user agent information
            $agent = new Agent();
            $agent->setUserAgent($request->userAgent());

            // Get location information
            // Add basic check to prevent error if IP is invalid for lookup
            $location = null;
            if (filter_var($clientIp, FILTER_VALIDATE_IP)) {
                 $location = Location::get($clientIp);
            }


            // Determine if this is an admin attempt
            $adminPrefix = config('backpack.base.route_prefix', 'admin');
            $isAdminAttempt = $request->is($adminPrefix) || $request->is($adminPrefix . '/*');
            $isHoneypot = $request->is('admin') || $request->is('admin/*');

            // Log the access
            AccessLog::create([
                'ip_address' => $clientIp,
                'user_agent' => $request->userAgent(),
                'url' => $request->fullUrl(),
                'method' => $request->method(),
                'referer' => $request->header('referer'),
                'is_admin_attempt' => $isAdminAttempt || $isHoneypot,
                'is_blocked' => false, // We already know it's not blocked if we reach here
                'request_data' => $request->all(), // Consider redacting sensitive data
                'country' => $location ? $location->countryName : null,
                'city' => $location ? $location->cityName : null,
                'browser' => $agent->browser(),
                'platform' => $agent->platform(),
                'device' => $agent->device(),
            ]);

            // If it's a honeypot attempt, log it (optional, might be redundant with is_admin_attempt)
            // Only log honeypot if it's NOT the real admin path to avoid double logging for real admin access
            if ($isHoneypot && !$isAdminAttempt) {
                Log::warning('Honeypot access attempt detected', [
                    'ip' => $clientIp, // Use $clientIp
                    'url' => $request->fullUrl(),
                    'user_agent' => $request->userAgent()
                ]);
            }
        } catch (\Exception $e) {
            // Log unexpected errors during detail gathering, but DON'T catch HttpExceptions here
            // (unless you specifically want to handle a different HttpException from detail gathering)
            Log::error('Error gathering details in LogAccessMiddleware (IP: '.$clientIp.'): ' . $e->getMessage(), ['exception' => $e]);
            // Allow the request to proceed even if detail logging fails
        }

        // --- Proceed with the request pipeline ---
        return $next($request);
    }
}
