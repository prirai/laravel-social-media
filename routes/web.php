<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [App\Http\Controllers\DashboardController::class, 'index'])->name('dashboard');

    // Add this route for post creation
    Route::post('/posts', [App\Http\Controllers\PostController::class, 'store'])->name('posts.store');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
