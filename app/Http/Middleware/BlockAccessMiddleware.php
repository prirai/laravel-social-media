<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Models\AccessLog;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpKernel\Exception\HttpException; // For abort()

class BlockAccessMiddleware
{
    /**
     * Handle an incoming request.
     * Checks if the requesting IP is blocked and aborts if it is.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function handle(Request $request, Closure $next): Response
    {
        // --- Get IP Address ---
        // Prioritize X-Real-IP if behind a proxy like Nginx, otherwise use standard request IP
        $clientIp = $request->header('X-Real-IP') ?? $request->ip();

        // --- Perform Blocking Check ---
        // Query the database to see if this IP address is marked as blocked.
        // We use `exists()` for efficiency as we only need to know if at least one record matches.
        $isBlocked = AccessLog::where('ip_address', $clientIp)
                              ->where('is_blocked', true)
                              ->exists();

        if ($isBlocked) {
            // Log the blocked attempt for security monitoring purposes.
            Log::warning('Blocked IP access attempt detected', [
                'ip' => $clientIp,
                'url' => $request->fullUrl(),
                'method' => $request->method(),
                'user_agent' => $request->userAgent()
            ]);

            // Abort the request immediately with a 403 Forbidden status code.
            // This prevents the request from proceeding further in the application.
            abort(403, 'Access Denied.'); // Message is optional, 'Unauthorized' or 'Forbidden' are common.
        }

        // --- If not blocked, proceed with the request pipeline ---
        // Pass the request to the next middleware or the route handler.
        return $next($request);
    }
}
