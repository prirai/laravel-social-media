<div class="card">
    <div class="card-header">
        <h3 class="card-title">Recent Verification Requests</h3>
    </div>
    <div class="card-body p-0">
        <div class="table-responsive">
            <table class="table table-striped">
                <thead>
                    <tr>
                        <th>User</th>
                        <th>Document Type</th>
                        <th>Submitted At</th>
                        <th>Status</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse($verifications as $verification)
                        <tr>
                            <td>{{ $verification->user->name }}</td>
                            <td>{{ $verification->document_type }}</td>
                            <td>{{ $verification->created_at->format('M d, Y') }}</td>
                            <td>
                                <span class="badge bg-warning">Pending</span>
                            </td>
                            <td>
                                <a href="{{ backpack_url('verification-document/'.$verification->id.'/show') }}" 
                                   class="btn btn-sm btn-link">
                                    <i class="la la-eye"></i> View
                                </a>
                            </td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="5" class="text-center">No pending verification requests</td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
        </div>
    </div>
    @if($pending_count > 5)
        <div class="card-footer text-center">
            <a href="{{ backpack_url('verification-document') }}">
                View all {{ $pending_count }} pending verification requests
            </a>
        </div>
    @endif
</div> 