<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class AddSecurityHeaders
{
    public function handle(Request $request, Closure $next)
    {
        $response = $next($request);
        
        // Add security headers with more permissive image-src
        $response->headers->set('Content-Security-Policy', 
            "default-src 'self'; 
            script-src 'self' 'unsafe-inline'; 
            style-src 'self' 'unsafe-inline' https://fonts.bunny.net; 
            font-src 'self' https://fonts.bunny.net; 
            img-src 'self' data: blob: *;");
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('X-XSS-Protection', '1; mode=block');
        $response->headers->set('X-Frame-Options', 'SAMEORIGIN');
        
        return $response;
    }
} 