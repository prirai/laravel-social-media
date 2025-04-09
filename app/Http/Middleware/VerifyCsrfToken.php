<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken as Middleware;
use Illuminate\Support\Facades\Log;
use Closure;
use Illuminate\Http\Request;

class VerifyCsrfToken extends Middleware
{
    /**
     * The URIs that should be excluded from CSRF verification.
     *
     * @var array<int, string>
     */
    protected $except = [
        // Add any routes that should be excluded here if absolutely necessary
    ];

    /**
     * Indicates whether the XSRF-TOKEN cookie should be set on the response.
     *
     * @var bool
     */
    protected $addHttpCookie = true;

    /**
     * Indicates whether the XSRF-TOKEN cookie should use the secure flag.
     *
     * @var bool
     */
    protected $secure = null;

    /**
     * The SameSite attribute for cookies.
     *
     * @var string|null
     */
    protected $sameSite = 'lax';

    /**
     * The constructor.
     */
    public function __construct()
    {
        // Set secure flag based on environment or explicitly from config
        $this->secure = env('SESSION_SECURE_COOKIE', env('APP_ENV') === 'production');
    }
    
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     *
     * @throws \Illuminate\Session\TokenMismatchException
     */
    public function handle($request, Closure $next)
    {
        // For GET requests, always refresh the CSRF token to ensure it's valid
        if ($request->isMethod('GET') && $request->hasSession()) {
            $request->session()->regenerateToken();
            
            Log::debug('CSRF token refreshed for GET request', [
                'path' => $request->path(),
                'session_id' => $request->session()->getId(),
                'token_partial' => substr($request->session()->token(), 0, 8) . '...'
            ]);
        }
        
        // For API requests, we may need different handling
        if ($request->expectsJson() && $this->inExceptArray($request)) {
            return $next($request);
        }
        
        // For GET, HEAD, OPTIONS requests - no verification needed
        if ($this->isReading($request)) {
            return $this->addCookieToResponse($request, $next($request));
        }
        
        // For routes explicitly excluded from CSRF protection
        if ($this->inExceptArray($request)) {
            return $next($request);
        }
        
        // Verify CSRF token
        if ($this->tokensMatch($request)) {
            return $this->addCookieToResponse($request, $next($request));
        }
        
        // If token verification failed, log the details
        $expectedToken = $request->session()->token();
        $actualToken = $request->input('_token') ?: $request->header('X-CSRF-TOKEN');
        
        Log::warning('CSRF token mismatch', [
            'path' => $request->path(),
            'method' => $request->method(),
            'expected_token_partial' => $expectedToken ? substr($expectedToken, 0, 8) . '...' : 'null',
            'expected_token_length' => $expectedToken ? strlen($expectedToken) : 0,
            'actual_token_partial' => $actualToken ? substr($actualToken, 0, 8) . '...' : 'null',
            'actual_token_length' => $actualToken ? strlen($actualToken) : 0,
            'tokens_match' => $expectedToken === $actualToken ? 'yes' : 'no',
            'session_id' => $request->session()->getId(),
            'referer' => $request->header('referer')
        ]);
        
        // Generate a fresh token before handling the exception
        $request->session()->regenerateToken();
        
        // Let Laravel handle the token mismatch
        return parent::handle($request, $next);
    }
} 