<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Admin\UserReportCrudController;
use App\Http\Controllers\Admin\ListingCrudController;

// --------------------------
// Custom Backpack Routes
// --------------------------
// This route file is loaded automatically by Backpack\CRUD.
// Routes you generate using Backpack\Generators will be placed here.

Route::group([
    'prefix' => config('backpack.base.route_prefix', 'admin'),
    'middleware' => array_merge(
        (array) config('backpack.base.web_middleware', 'web'),
        (array) config('backpack.base.middleware_key', 'admin')
    ),
    'namespace' => 'App\Http\Controllers\Admin',
], function () { // custom admin routes
    Route::crud('user', 'UserCrudController');
    Route::crud('user-report', 'UserReportCrudController');
    Route::get('delete-reported-user/{user}', [UserReportCrudController::class, 'deleteReportedUser'])
        ->name('admin.delete-reported-user');
    Route::crud('listing', 'ListingCrudController');
    Route::get('verify-listing/{id}', [ListingCrudController::class, 'verifyListing'])
        ->name('admin.verify-listing');
}); // this should be the absolute last line of this file

/**
 * DO NOT ADD ANYTHING HERE.
 */
