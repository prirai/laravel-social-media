<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class AddSecurityHeaders
{
    public function handle(Request $request, Closure $next)
    {
        $response = $next($request);
        
        // Check if this is a notification route
        $isNotificationRoute = $request->is('notifications/*');
        
        // Add security headers with more comprehensive Content-Security-Policy
        $csp = "default-src 'self'; 
            script-src 'self' 'unsafe-inline' 'unsafe-eval'; 
            style-src 'self' 'unsafe-inline' https://fonts.bunny.net; 
            font-src 'self' https://fonts.bunny.net; 
            img-src 'self' data: blob: *; 
            connect-src 'self' ws: wss:; 
            frame-src 'self'; 
            object-src 'none'; 
            base-uri 'self'; 
            form-action 'self';";
            
        // If this is a notification route, add a more permissive connect-src
        if ($isNotificationRoute) {
            $csp = "default-src 'self'; 
                script-src 'self' 'unsafe-inline' 'unsafe-eval'; 
                style-src 'self' 'unsafe-inline' https://fonts.bunny.net; 
                font-src 'self' https://fonts.bunny.net; 
                img-src 'self' data: blob: *; 
                connect-src 'self' ws: wss: *; 
                frame-src 'self'; 
                object-src 'none'; 
                base-uri 'self'; 
                form-action 'self';";
        }
        
        $response->headers->set('Content-Security-Policy', $csp);
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('X-XSS-Protection', '1; mode=block');
        $response->headers->set('X-Frame-Options', 'SAMEORIGIN');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->headers->set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
        
        return $response;
    }
} 