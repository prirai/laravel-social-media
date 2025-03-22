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