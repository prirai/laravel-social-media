@component('mail::message')
# Reset Your Password

Hi {{ $user->name }},

We received a request to reset your password. Your verification code is:

@component('mail::panel')
<div style="font-size: 32px; font-weight: bold; text-align: center; letter-spacing: 8px;">
{{ $otp }}
</div>
@endcomponent

This code will expire in 5 minutes.

If you didn't request to reset your password, please ignore this email or contact support if you have concerns about your account security.

Thanks,<br>
{{ config('app.name') }}
@endcomponent 