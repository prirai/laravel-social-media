@if($entry->user->verification_status !== 'verified')
    <button 
        class="btn btn-sm btn-warning verify-doc-btn" 
        data-route="{{ url($crud->route.'/'.$entry->getKey().'/verify') }}">
        <i class="la la-check"></i> Verify
    </button>
@else
    <span class="badge bg-success"><i class="la la-check"></i> Verified</span>
@endif 