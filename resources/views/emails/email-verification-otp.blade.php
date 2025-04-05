@component('mail::message')
# Verify Your Email

Hi {{ $user->name }},

Thank you for signing up! Your email verification code is:

@component('mail::panel')
<div style="font-size: 32px; font-weight: bold; text-align: center; letter-spacing: 8px;">
{{ $otp }}
</div>
@endcomponent

This code will expire in 5 minutes.

If you didn't request this code, please ignore this email or contact support if you have concerns.

Thanks,<br>
{{ config('app.name') }}
@endcomponent 