<?php

use App\Models\User;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

test('profile page is displayed', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->get('/settings/profile');

    $response->assertOk();
});

test('profile information can be updated', function () {
    $user = User::factory()->unverified()->create();

    $response = $this
        ->actingAs($user)
        ->post('/settings/profile', [
            'name' => 'Test User',
            'username' => 'test_user123',
            'email' => 'test@example.com',
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect('/settings/profile');

    $user->refresh();

    expect($user->name)->toBe('Test User');
    expect($user->username)->toBe('test_user123');
    expect($user->email)->toBe('test@example.com');
    expect($user->email_verified_at)->toBeNull();
});

test('email verification status is unchanged when the email address is unchanged', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->post('/settings/profile', [
            'name' => 'Test User',
            'username' => 'test_user456',
            'email' => $user->email,
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect('/settings/profile');

    expect($user->refresh()->email_verified_at)->not->toBeNull();
});

test('email verification status is reset when email address is changed', function () {
    $user = User::factory()->create();
    
    // Make sure the user starts with a verified email
    expect($user->email_verified_at)->not->toBeNull();
    
    $response = $this
        ->actingAs($user)
        ->post('/settings/profile', [
            'name' => $user->name,
            'username' => $user->username,
            'email' => 'newemail@example.com',  // Changed email address
        ]);
    
    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect('/settings/profile');
    
    $user->refresh();
    
    expect($user->email)->toBe('newemail@example.com');
    expect($user->email_verified_at)->toBeNull();
});

test('user can delete their account', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->delete('/settings/profile', [
            'password' => 'password',
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect('/');

    $this->assertGuest();
    expect($user->fresh())->toBeNull();
});

test('correct password must be provided to delete account', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->from('/settings/profile')
        ->delete('/settings/profile', [
            'password' => 'wrong-password',
        ]);

    $response
        ->assertSessionHasErrors('password')
        ->assertRedirect('/settings/profile');

    expect($user->fresh())->not->toBeNull();
});