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
            // Check if the IP is blocked
            $isBlocked = AccessLog::where('ip_address', $request->ip())
                ->where('is_blocked', true)
                ->exists();

            if ($isBlocked) {
                abort(403, 'Unauthorized');
            }

            // Get user agent information
            $agent = new Agent();
            $agent->setUserAgent($request->userAgent());

            // Get location information
            $location = Location::get($request->ip());

            // Determine if this is an admin attempt based on the actual route prefix
            $adminPrefix = config('backpack.base.route_prefix', 'admin');
            $isAdminAttempt = $request->is($adminPrefix) || $request->is($adminPrefix . '/*');

            // Special check for honeypot '/admin' path
            $isHoneypot = $request->is('admin') || $request->is('admin/*');

            // Log the access
            AccessLog::create([
                'ip_address' => $request->header('X-Real-IP'),
                'user_agent' => $request->userAgent(),
                'url' => $request->fullUrl(),
                'method' => $request->method(),
                'referer' => $request->header('referer'),
                'is_admin_attempt' => $isAdminAttempt || $isHoneypot, // Mark both admin and honeypot attempts
                'is_blocked' => false, // Default to not blocked
                'request_data' => $request->all(),
                'country' => $location ? $location->countryName : null,
                'city' => $location ? $location->cityName : null,
                'browser' => $agent->browser(),
                'platform' => $agent->platform(),
                'device' => $agent->device(),
            ]);

            // If it's a honeypot attempt, we could take additional action here
            if ($isHoneypot) {
                Log::warning('Honeypot access attempt detected', [
                    'ip' => $request->header('X-Real-IP'),
                    'url' => $request->fullUrl(),
                    'user_agent' => $request->userAgent()
                ]);
            }
        } catch (\Exception $e) {
            // Log the error but don't block the request
            Log::error('Error in LogAccessMiddleware: ' . $e->getMessage());
        }

        return $next($request);
    }
}
