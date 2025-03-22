@if($entry->user && $entry->user->verification_status !== 'verified')
    <button 
        type="button"
        class="btn btn-sm btn-success verify-doc-btn" 
        data-route="{{ url($crud->route.'/'.$entry->getKey().'/verify') }}">
        <i class="la la-check"></i> Approve User
    </button>
@else
    <span class="badge bg-success"><i class="la la-check"></i> User Verified</span>
@endif

@push('after_scripts')
@bassetBlock('verify-script')
<script>
    document.addEventListener('DOMContentLoaded', function() {
        if (typeof window.verificationHandlersInitialized === 'undefined') {
            $('body').on('click', '.verify-doc-btn', function(e) {
                e.preventDefault();
                var button = $(this);
                var route = button.data('route');
                
                console.log('Button clicked, route:', route); // Debug log

                swal({
                    title: "Verify User?",
                    text: "Are you sure you want to verify this user?",
                    icon: "info",
                    buttons: {
                        cancel: {
                            text: "Cancel",
                            value: null,
                            visible: true,
                            className: "bg-secondary",
                            closeModal: true,
                        },
                        verify: {
                            text: "Yes, Verify User",
                            value: true,
                            visible: true,
                            className: "bg-success",
                        }
                    },
                }).then((value) => {
                    console.log('Swal value:', value); // Debug log
                    if (value) {
                        // Debug log the AJAX request
                        console.log('Sending AJAX request to:', route);
                        
                        $.ajax({
                            url: route,
                            type: 'POST',
                            data: {
                                _token: $('meta[name="csrf-token"]').attr('content')
                            },
                            beforeSend: function() {
                                console.log('AJAX request starting...'); // Debug log
                            },
                            success: function(result) {
                                console.log('AJAX success:', result); // Debug log
                                if (result.success) {
                                    new Noty({
                                        type: "success",
                                        text: "User verified successfully"
                                    }).show();
                                    
                                    if (typeof crud !== 'undefined' && crud.table) {
                                        crud.table.ajax.reload();
                                    }
                                }
                            },
                            error: function(xhr, status, error) {
                                console.log('AJAX error:', {xhr, status, error}); // Debug log
                                new Noty({
                                    type: "error",
                                    text: "Error verifying user: " + error
                                }).show();
                            }
                        });
                    }
                });
            });
            window.verificationHandlersInitialized = true;
        }
    });
</script>
@endBassetBlock
@if (!request()->ajax()) @endpush @endif 