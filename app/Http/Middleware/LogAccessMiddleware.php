<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Models\AccessLog;
use Jenssegers\Agent\Agent;
use Stevebauman\Location\Facades\Location;
use Illuminate\Support\Facades\Log;
// No longer need HttpException here unless specifically catching other HTTP exceptions

class LogAccessMiddleware
{
    /**
     * Handle an incoming request.
     * Logs access details after the BlockAccessMiddleware has passed.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        Log::debug('LogAccessMiddleware: Running for path: ' . $request->path());

        // --- Get IP Address (still needed for logging) ---
        $clientIp = $request->header('X-Real-IP') ?? $request->ip();

        // --- Try to log details ---
        // The blocking check is now handled by BlockAccessMiddleware
        try {
            // Get user agent information
            $agent = new Agent();
            $agent->setUserAgent($request->userAgent());

            // Get location information
            $location = null;
            // Add basic check to prevent error if IP is invalid for lookup (e.g., '::1' locally might fail)
            if (filter_var($clientIp, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
                 try {
                    $location = Location::get($clientIp);
                 } catch (\Exception $e) {
                    Log::warning('LogAccessMiddleware: Could not get location for IP: ' . $clientIp . ' - ' . $e->getMessage());
                    $location = null; // Ensure location is null if lookup fails
                 }
            } else {
                 Log::debug('LogAccessMiddleware: Skipping location lookup for private/reserved IP: ' . $clientIp);
            }


            // Determine if this is an admin attempt
            // Using config ensures flexibility if the admin prefix changes
            $adminPrefix = config('backpack.base.route_prefix', 'admin'); // Default to 'admin' if not set
            $isAdminAttempt = $request->is($adminPrefix) || $request->is($adminPrefix . '/*');
            // Check specifically for the honeypot path '/admin' IF it's different from the actual admin prefix
            $isHoneypot = $request->is('admin') && $adminPrefix !== 'admin'; // More specific honeypot check

            // Log the access
            AccessLog::create([
                'ip_address' => $clientIp,
                'user_agent' => $request->userAgent(),
                'url' => $request->fullUrl(),
                'method' => $request->method(),
                'referer' => $request->header('referer'),
                // is_blocked is now handled by BlockAccessMiddleware.
                // We know if we reach here, it wasn't blocked *by that middleware*.
                // We might still want to log honeypot attempts separately.
                'is_admin_attempt' => $isAdminAttempt || $isHoneypot, // Combine flags for simplicity in DB
                'is_blocked' => false, // Explicitly set to false as BlockAccessMiddleware allowed it
                'request_data' => $request->all() ? json_encode($request->except(['password', 'password_confirmation', '_token'])) : null, // Redact sensitive data & handle empty requests
                'country' => $location?->countryName, // Use null safe operator
                'city' => $location?->cityName,
                'browser' => $agent->browser(),
                'platform' => $agent->platform(),
                'device' => $agent->device(),
            ]);

            // Log honeypot access specifically if needed (might be redundant with is_admin_attempt=true)
            if ($isHoneypot) {
                Log::warning('Honeypot access attempt detected (and logged)', [
                    'ip' => $clientIp,
                    'url' => $request->fullUrl(),
                    'user_agent' => $request->userAgent()
                ]);
            }
        } catch (\Exception $e) {
            // Log unexpected errors during detail gathering
            Log::error('Error logging details in LogAccessMiddleware (IP: '.$clientIp.'): ' . $e->getMessage(), ['exception' => $e]);
            // Allow the request to proceed even if detail logging fails
        }

        // --- Proceed with the request pipeline ---
        return $next($request);
    }
}
