@push('after_scripts')
<script>
$(function() {
    if (typeof window.verificationHandlersInitialized === 'undefined') {
        $('body').on('click', '.verify-user-btn', function(e) {
            e.preventDefault();
            var button = $(this);
            var userId = button.data('id');
            
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
                if (value) {
                    $.ajax({
                        url: `${window.location.pathname}/verify-user/${userId}`,
                        type: 'POST',
                        data: {
                            _token: $('meta[name="csrf-token"]').attr('content')
                        },
                        success: function(result) {
                            if (result.success) {
                                new Noty({
                                    type: "success",
                                    text: "User verified successfully"
                                }).show();
                                crud.table.ajax.reload();
                            }
                        },
                        error: function() {
                            new Noty({
                                type: "error",
                                text: "Error verifying user"
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
@endpush 