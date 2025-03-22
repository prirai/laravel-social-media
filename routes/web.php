<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\MessagingController;
use App\Http\Controllers\MarketplaceController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\VerificationController;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
        Route::get('dashboard', [App\Http\Controllers\DashboardController::class, 'index'])->name('dashboard');
        Route::post('/posts', [App\Http\Controllers\PostController::class, 'store'])->name('posts.store');
        Route::post('/posts/{post}/like', [App\Http\Controllers\PostController::class, 'like'])->name('posts.like');
        Route::post('/posts/{post}/comment', [App\Http\Controllers\PostController::class, 'comment'])->name('posts.comment');
        Route::post('/profile', [App\Http\Controllers\Settings\ProfileController::class, 'update'])->name('profile.update');
        Route::get('/profile', [App\Http\Controllers\Settings\ProfileController::class, 'edit'])->name('profile.edit');
        Route::get('/messages', [MessagingController::class, 'index'])->name('messages.index');
        Route::get('/messages/{user}', [MessagingController::class, 'getMessages'])->name('messages.get');
        Route::post('/messages/{user}', [MessagingController::class, 'sendMessage'])->name('messages.send');
        Route::post('/messages/{user}/read', [MessagingController::class, 'markAsRead'])->name('messages.read');
    });

Route::middleware(['auth'])->group(function () {
    Route::get('/marketplace', [MarketplaceController::class, 'index'])->name('marketplace.index');
    Route::post('/marketplace', [MarketplaceController::class, 'store'])->name('marketplace.store');
    Route::post('/groups', [MessagingController::class, 'createGroup'])->name('groups.create');
    Route::post('/groups/{group}/messages', [MessagingController::class, 'sendGroupMessage'])->name('groups.message');
    Route::get('/groups/{group}/messages', [MessagingController::class, 'getGroupMessages'])->name('groups.messages');
    Route::get('/profile/{username}', [ProfileController::class, 'show'])->name('profile.show');
    Route::post('/users/{username}/report', [ProfileController::class, 'report'])->name('users.report');
});

Route::post('user/submit-verification', [VerificationController::class, 'submit'])->name('user.submit-verification');

Route::get('/debug-verification', function() {
    dd(\App\Models\VerificationDocument::with('user')->get()->toArray());
});

Route::get('/test-verification', function() {
    dd([
        'count' => \App\Models\VerificationDocument::count(),
        'first' => \App\Models\VerificationDocument::first(),
        'all' => \App\Models\VerificationDocument::all()
    ]);
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
