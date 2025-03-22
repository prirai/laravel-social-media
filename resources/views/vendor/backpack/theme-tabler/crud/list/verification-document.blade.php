@extends(backpack_theme_view('layouts.default'))

@section('content')
    <div class="container-fluid">
        <h2>
            <span class="text-capitalize">{{ $crud->entity_name_plural }}</span>
            <small>{{ trans('backpack::crud.all') }}</small>
        </h2>
    </div>

    @include(backpack_theme_view('crud.inc.grouped_errors'))

    <div class="card">
        <div class="card-body">
            <table class="table" id="crudTable">
                <thead>
                    <tr>
                        @foreach ($crud->columns() as $column)
                            <th>{!! $column['label'] !!}</th>
                        @endforeach
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                </tbody>
            </table>
        </div>
    </div>
@endsection

@push('after_scripts')
<script>
    $(document).ready(function() {
        // Initialize DataTable
        crud.table = $("#crudTable").DataTable(crud.dataTableConfiguration);

        // Handle verify button clicks
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