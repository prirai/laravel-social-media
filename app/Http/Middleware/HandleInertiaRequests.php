<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Illuminate\Session\TokenMismatchException;
use Inertia\Middleware;
use Symfony\Component\HttpFoundation\Response;
use Tighten\Ziggy\Ziggy;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Handle the request and check for invalid session before proceeding.
     */
    public function handle(Request $request, \Closure $next): Response
    {
        try {
            $response = parent::handle($request, $next);
            return $response;
        } catch (TokenMismatchException $e) {
            // If there's a CSRF token mismatch, redirect to login
            if ($request->expectsJson()) {
                return response()->json(['message' => 'CSRF token mismatch. Please refresh and try again.'], 419);
            }
            return redirect()->route('login');
        }
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        [$message, $author] = str(Inspiring::quotes()->random())->explode('-');

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'quote' => ['message' => trim($message), 'author' => trim($author)],
            // 'auth' => [
            //     'user' => $request->user(),
            // ],
            'auth' => [
                    'user' => $request->user() ? [
                        'id' => $request->user()->id,
                        'name' => $request->user()->name,
                        'email' => $request->user()->email,
                        'email_verified_at' => $request->user()->email_verified_at,
                        'verification_status' => $request->user()->verification_status,
                        'username' => $request->user()->username ?? null,
                        'avatar' => $request->user()->avatar ?? null,
                    ] : null,
                    ],

            'ziggy' => fn (): array => [
                ...(new Ziggy)->toArray(),
                'location' => $request->url(),
            ]
        ];
    }
}
