<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\MessagingController;
use App\Http\Controllers\MarketplaceController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\VerificationController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\FriendRequestController;
use App\Http\Controllers\CustomEmailVerificationController;
// use Illuminate\Foundation\Auth\EmailVerificationRequest; // Removed unused import
use App\Http\Controllers\BlockchainController;
use App\Http\Middleware\LogAccessMiddleware; // Keep this if used selectively

// BlockAccessMiddleware runs globally via Kernel.php (assuming Kernel.php is corrected as per previous steps)
// LogAccessMiddleware is now applied selectively where needed, or globally if intended via Kernel.php

// If LogAccessMiddleware is NOT global in Kernel.php and you want '/' logged:
// Route::middleware(LogAccessMiddleware::class)->get('/', function () {
//     return Inertia::render('welcome');
// })->name('home');
// If LogAccessMiddleware IS global in Kernel.php, this simpler route is sufficient:
Route::get('/', function () {
     return Inertia::render('welcome');
 })->name('home');


Route::middleware(['auth'])->group(function () {
        Route::get('dashboard', [App\Http\Controllers\DashboardController::class, 'index'])->name('dashboard');
        Route::post('/posts', [App\Http\Controllers\PostController::class, 'store'])->name('posts.store');
        Route::delete('/posts/{post}', [App\Http\Controllers\PostController::class, 'destroy'])->name('posts.destroy');
        Route::delete('/comments/{comment}', [App\Http\Controllers\PostController::class, 'destroyComment'])->name('comments.destroy');
        Route::post('/posts/{post}/like', [App\Http\Controllers\PostController::class, 'like'])->name('posts.like');
        Route::post('/posts/{post}/comment', [App\Http\Controllers\PostController::class, 'comment'])->name('posts.comment');
        Route::post('/profile', [App\Http\Controllers\Settings\ProfileController::class, 'update'])->name('profile.update');
        Route::get('/profile', [App\Http\Controllers\Settings\ProfileController::class, 'edit'])->name('profile.edit');
        Route::get('/messages', [MessagingController::class, 'index'])->name('messages.index');
        Route::get('/messages/{user}', [MessagingController::class, 'getMessages'])->name('messages.get');
        Route::post('/messages/{user}', [MessagingController::class, 'sendMessage'])->name('messages.send');
        Route::post('/messages/{user}/read', [MessagingController::class, 'markAsRead'])->name('messages.read');
        Route::delete('/messages/{message}', [MessagingController::class, 'destroy'])->name('messages.destroy');
    });

Route::middleware(['auth'])->group(function () {
    Route::get('/marketplace', [MarketplaceController::class, 'index'])->name('marketplace.index');
    Route::post('/marketplace', [MarketplaceController::class, 'store'])->name('marketplace.store');
    Route::delete('/marketplace/{listing}', [MarketplaceController::class, 'destroy'])->name('marketplace.destroy');
    Route::get('/marketplace/payment/{listing}', [MarketplaceController::class, 'showPayment'])->name('marketplace.payment');
    Route::post('/groups', [MessagingController::class, 'createGroup'])->name('groups.create');
    Route::post('/groups/{group}/messages', [MessagingController::class, 'sendGroupMessage'])->name('groups.message');
    Route::get('/groups/{group}/messages', [MessagingController::class, 'getGroupMessages'])->name('groups.messages');
    Route::delete('/group-messages/{groupMessage}', [MessagingController::class, 'destroyGroupMessage'])->name('group-messages.destroy');
    Route::post('/groups/{group}/add-members', [MessagingController::class, 'addGroupMembers'])->name('groups.add-members');
    Route::get('/profile/{username}', [ProfileController::class, 'show'])->name('profile.show');
    Route::post('/users/{username}/report', [ProfileController::class, 'report'])->name('users.report');
    Route::post('/users/{username}/friend-request', [FriendRequestController::class, 'send'])->name('friend-requests.send');
    Route::post('/friend-requests/{friendRequest}/accept', [FriendRequestController::class, 'accept'])->name('friend-requests.accept');
    Route::post('/friend-requests/{friendRequest}/reject', [FriendRequestController::class, 'reject'])->name('friend-requests.reject');
    Route::delete('/friend-requests/{friendRequest}', [FriendRequestController::class, 'cancel'])->name('friend-requests.cancel');

    // Notification routes
    Route::get('/notifications', [App\Http\Controllers\NotificationsController::class, 'index'])->name('notifications.index');
    Route::get('/notifications/unread-count', [App\Http\Controllers\NotificationsController::class, 'getUnreadCount'])->name('notifications.unread-count');
    Route::post('/notifications/{notification}/read', [App\Http\Controllers\NotificationsController::class, 'markAsRead'])->name('notifications.read');
    Route::post('/notifications/mark-all-read', [App\Http\Controllers\NotificationsController::class, 'markAllAsRead'])->name('notifications.mark-all-read');

    // Blockchain routes
    Route::get('/blockchain', [BlockchainController::class, 'index'])->name('blockchain.index');
    Route::post('/blockchain/verify/{user}', [BlockchainController::class, 'verifyUser'])->name('blockchain.verify');
    Route::get('/blockchain/validate', [BlockchainController::class, 'validateChain'])->name('blockchain.validate');
});

Route::post('user/submit-verification', [VerificationController::class, 'submit'])->name('user.submit-verification');
//email verification
Route::post('user/verify-email', [CustomEmailVerificationController::class, 'submit'])->name('user.verify-email');

// Password reset OTP routes (not requiring authentication)
Route::post('user/password-reset/send-otp', [UserController::class, 'sendPasswordResetOtp'])->name('user.password-reset.send-otp');
Route::post('user/password-reset/verify-otp', [UserController::class, 'verifyPasswordResetOtp'])->name('user.password-reset.verify-otp');
Route::post('user/password-reset/reset', [UserController::class, 'resetPasswordAfterOtp'])->name('user.password-reset.reset');

// New OTP verification routes
Route::post('user/send-email-otp', [UserController::class, 'sendEmailOtp'])->name('user.send-email-otp');
Route::post('user/verify-email-otp', [UserController::class, 'verifyEmailWithOtp'])->name('user.verify-email-otp');

Route::get('/users/search', [UserController::class, 'search'])->name('users.search');

// New route for public key management
Route::post('user/update-public-key', [UserController::class, 'updatePublicKey'])->name('user.update-public-key');

// Route::get('/debug-verification', function() {
//     dd(\App\Models\VerificationDocument::with('user')->get()->toArray());
// });

// Route::get('/test-verification', function() {
//     dd([
//         'count' => \App\Models\VerificationDocument::count(),
//         'first' => \App\Models\VerificationDocument::first(),
//         'all' => \App\Models\VerificationDocument::all()
//     ]);
// });

// Dummy admin route - apply LogAccessMiddleware specifically here if it's NOT global
// Ensure 'web' middleware group is applied (usually automatic via RouteServiceProvider)
Route::middleware(['web', LogAccessMiddleware::class]) // Apply LogAccessMiddleware specifically here
    ->get('/admin', function () {
        return view('dummy-admin');
    }); // Removed name('dummy-admin') as it wasn't present before

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
