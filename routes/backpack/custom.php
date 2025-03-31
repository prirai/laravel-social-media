<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Admin\UserReportCrudController;
use App\Http\Controllers\Admin\ListingCrudController;
use App\Http\Controllers\Admin\VerificationCrudController;
use App\Http\Controllers\Admin\VerificationDocumentCrudController;
use App\Http\Controllers\Admin\PostCrudController;

// --------------------------
// Custom Backpack Routes
// --------------------------
// This route file is loaded automatically by Backpack\Base.
// Routes you generate using Backpack\Generators will be placed here.

Route::group([
    'prefix' => config('backpack.base.route_prefix', 'admin'),
    'middleware' => array_merge(
        (array) config('backpack.base.web_middleware', 'web'),
        (array) config('backpack.base.middleware_key', 'admin')
    ),
    'namespace' => 'App\Http\Controllers\Admin',
], function () {
    Route::crud('user', 'UserCrudController');
    Route::crud('user-report', 'UserReportCrudController');
    Route::get('delete-reported-user/{user}', [UserReportCrudController::class, 'deleteReportedUser'])
        ->name('admin.delete-reported-user');
    Route::crud('listing', 'ListingCrudController');
    Route::get('verify-listing/{id}', [ListingCrudController::class, 'verifyListing'])
        ->name('admin.verify-listing');
    Route::crud('verifications', 'VerificationCrudController');
    Route::post('verifications/{id}/verify', 'VerificationCrudController@verify');
    Route::crud('verification-document', 'VerificationCrudController');
    Route::post('verification-document/{id}/verify', 'VerificationCrudController@verify')
        ->name('verification-document.verify');
    Route::crud('post', 'PostCrudController');
});