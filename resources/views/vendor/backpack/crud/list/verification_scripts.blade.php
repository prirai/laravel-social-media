@push('after_scripts')
<script>
    document.addEventListener("DOMContentLoaded", function() {
        document.querySelectorAll(".verify-user-btn").forEach(function(button) {
            button.addEventListener("click", function(e) {
                e.preventDefault();
                const userId = this.dataset.id;
                const button = this;
                
                if (confirm("Are you sure you want to verify this user?")) {
                    fetch(`{{ url(config('backpack.base.route_prefix') . '/verification-document/verify-user') }}/${userId}`, {
                        method: "POST",
                        headers: {
                            "X-CSRF-TOKEN": document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                            "Content-Type": "application/json",
                            "Accept": "application/json"
                        }
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            // Update the status badge
                            const row = button.closest('tr');
                            const badge = row.querySelector('.badge');
                            badge.classList.remove('bg-warning');
                            badge.classList.add('bg-success');
                            badge.innerHTML = '<i class="la la-check"></i> Verified';
                            
                            // Remove the verify button
                            button.remove();
                            
                            // Show success message
                            new Noty({
                                type: 'success',
                                text: data.message
                            }).show();
                        }
                    })
                    .catch(error => {
                        console.error('Error:', error);
                        new Noty({
                            type: 'error',
                            text: 'Error verifying user'
                        }).show();
                    });
                }
            });
        });
    });
</script>
@endpush 