<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Models\AccessLog;
use Jenssegers\Agent\Agent;
use Stevebauman\Location\Facades\Location;
use Illuminate\Support\Facades\Log;

class LogAccessMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        try {
            // --- Get IP Address from Header ---
            // Prioritize X-Real-IP as set by Nginx, fallback to Laravel's calculation
            // (which might still be 127.0.0.1 if TrustProxies isn't working as expected)
            $clientIp = $request->header('X-Real-IP') ?? $request->ip();
            // Alternative: Use X-Forwarded-For first if preferred
            // $clientIp = $request->header('X-Forwarded-For') ?? $request->header('X-Real-IP') ?? $request->ip();

            // --- Check if the IP is blocked using the determined client IP ---
            $isBlocked = AccessLog::where('ip_address', $clientIp) // Use $clientIp
                                  ->where('is_blocked', true)
                                  ->exists();

            if ($isBlocked) {
                // Optional: Log the blocked attempt with the correct IP
                Log::warning('Blocked IP access attempt detected', [
                    'ip' => $clientIp,
                    'url' => $request->fullUrl(),
                    'user_agent' => $request->userAgent()
                ]);
                abort(403, 'Unauthorized');
            }

            // Get user agent information
            $agent = new Agent();
            $agent->setUserAgent($request->userAgent());

            // --- Get location information using the determined client IP ---
            $location = Location::get($clientIp); // Use $clientIp

            // Determine if this is an admin attempt based on the actual route prefix
            $adminPrefix = config('backpack.base.route_prefix', 'admin');
            $isAdminAttempt = $request->is($adminPrefix) || $request->is($adminPrefix . '/*');

            // Special check for honeypot '/admin' path
            $isHoneypot = $request->is('admin') || $request->is('admin/*');

            // --- Log the access using the determined client IP ---
            AccessLog::create([
                'ip_address' => $clientIp, // Use $clientIp
                'user_agent' => $request->userAgent(),
                'url' => $request->fullUrl(),
                'method' => $request->method(),
                'referer' => $request->header('referer'),
                'is_admin_attempt' => $isAdminAttempt || $isHoneypot,
                'is_blocked' => false, // Default to not blocked
                'request_data' => $request->all(), // Consider redacting sensitive data
                'country' => $location ? $location->countryName : null,
                'city' => $location ? $location->cityName : null,
                'browser' => $agent->browser(),
                'platform' => $agent->platform(),
                'device' => $agent->device(),
            ]);

            // If it's a honeypot attempt, log with the correct IP
            if ($isHoneypot) {
                Log::warning('Honeypot access attempt detected', [
                    'ip' => $clientIp, // Use $clientIp
                    'url' => $request->fullUrl(),
                    'user_agent' => $request->userAgent()
                ]);
            }
        } catch (\Exception $e) {
            // Log the error but don't block the request
            Log::error('Error in LogAccessMiddleware: ' . $e->getMessage(), ['exception' => $e]);
        }

        return $next($request);
    }
}
