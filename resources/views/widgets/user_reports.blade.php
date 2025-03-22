<div class="card">
    <div class="card-header">
        <h3 class="card-title">Recent User Reports</h3>
    </div>
    <div class="card-body p-0">
        <div class="table-responsive">
            <table class="table table-striped">
                <thead>
                    <tr>
                        <th>Reported User</th>
                        <th>Reporter</th>
                        <th>Reason</th>
                        <th>Status</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse($reports as $report)
                        <tr>
                            <td>{{ $report->reportedUser->name }}</td>
                            <td>{{ $report->reporter->name }}</td>
                            <td>{{ Str::limit($report->reason, 50) }}</td>
                            <td>{!! $report->status_badge !!}</td>
                            <td>
                                <a href="{{ backpack_url('user-report/'.$report->id.'/show') }}" 
                                   class="btn btn-sm btn-link">
                                    <i class="la la-eye"></i> View
                                </a>
                            </td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="5" class="text-center">No pending reports</td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
        </div>
    </div>
    @if($pending_count > 5)
        <div class="card-footer text-center">
            <a href="{{ backpack_url('user-report') }}">
                View all {{ $pending_count }} pending reports
            </a>
        </div>
    @endif
</div> 