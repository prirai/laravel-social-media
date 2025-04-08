{{-- This file is used for menu items by any Backpack v6 theme --}}
<li class="nav-item"><a class="nav-link" href="{{ backpack_url('dashboard') }}"><i class="la la-home nav-icon"></i> {{ trans('backpack::base.dashboard') }}</a></li>

<x-backpack::menu-item title="Users" icon="la la-users" :link="backpack_url('user')" />

<x-backpack::menu-item
    title="User Reports"
    icon="la la-flag"
    :link="backpack_url('user-report')"
    badge="{{ \App\Models\UserReport::where('status', 'pending')->count() ?: '' }}"
    badge-class="bg-danger"
/>

<x-backpack::menu-item
    title="Posts"
    icon="la la-newspaper"
    :link="backpack_url('post')"
/>

<x-backpack::menu-item
    title="Listings"
    icon="la la-tag"
    :link="backpack_url('listing')"
    badge="{{ \App\Models\Listing::where('status', 'unverified')->count() ?: '' }}"
    badge-class="bg-warning"
/>

<x-backpack::menu-item
    title="Access Logs"
    icon="la la-shield-alt"
    :link="backpack_url('access-log')"
    badge="{{ \App\Models\AccessLog::where('is_admin_attempt', true)->where('created_at', '>=', now()->subDay())->count() ?: '' }}"
    badge-class="bg-danger"
/>

{{--<x-backpack::menu-item --}}
{{--    title="Verifications" --}}
{{--    icon="la la-id-card" --}}
{{--    :link="backpack_url('verification-document')"--}}
{{--    badge="{{ \App\Models\VerificationDocument::whereHas('user', function($query) { --}}
{{--        $query->where('verification_status', 'pending');--}}
{{--    })->count() ?: '' }}"--}}
{{--    badge-class="bg-warning"--}}
{{--/>--}}
