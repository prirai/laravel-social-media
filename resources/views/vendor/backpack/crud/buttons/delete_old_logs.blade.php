@if ($crud->hasAccess('deleteOldLogs'))
<a href="javascript:void(0)" 
   onclick="if(confirm('Are you sure you want to delete ALL access logs older than {{ $days }} days? This action cannot be undone.')) { 
       event.preventDefault(); 
       document.getElementById('delete-old-logs-form-{{ $days }}').submit(); 
   }" 
   class="btn btn-warning ml-2">
   <i class="la la-trash"></i> Delete Logs > {{ $days }} days old
</a>
<form id="delete-old-logs-form-{{ $days }}" 
      action="{{ url($crud->route.'/delete-old-logs/' . $days) }}" 
      method="POST" 
      style="display: none;">
    @csrf
</form>
@endif 