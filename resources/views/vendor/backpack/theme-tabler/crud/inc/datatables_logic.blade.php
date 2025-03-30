@push('after_scripts')
    @include(backpack_view('crud.inc.datatables_logic'))

    <script>
        $(document).ready(function() {
            $('body').on('click', '.verify-doc-btn', function(e) {
                e.preventDefault();
                var button = $(this);
                var route = button.data('route');

                swal({
                    title: "Are you sure?",
                    text: "Are you sure you want to verify this document?",
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
                            text: "Yes, verify",
                            value: true,
                            visible: true,
                            className: "bg-success",
                        }
                    },
                }).then((value) => {
                    if (value) {
                        $.ajax({
                            url: route,
                            type: 'POST',
                            data: {
                                _token: $('meta[name="csrf-token"]').attr('content')
                            },
                            success: function(result) {
                                if (result.success) {
                                    new Noty({
                                        type: "success",
                                        text: "Document verified successfully"
                                    }).show();
                                    crud.table.ajax.reload();
                                }
                            },
                            error: function() {
                                new Noty({
                                    type: "error",
                                    text: "Error verifying document"
                                }).show();
                            }
                        });
                    }
                });
            });
        });
    </script>
@endpush 