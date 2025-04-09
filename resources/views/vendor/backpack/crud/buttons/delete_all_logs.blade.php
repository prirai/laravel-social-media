@if ($crud->hasAccess('deleteAllLogs'))
<a href="javascript:void(0)" 
   onclick="if(confirm('Are you sure you want to delete ALL access logs? This action cannot be undone.')) { 
       event.preventDefault(); 
       document.getElementById('delete-all-logs-form').submit(); 
   }" 
   class="btn btn-danger">
   <i class="la la-trash"></i> Delete All Logs
</a>
<form id="delete-all-logs-form" 
      action="{{ url($crud->route.'/delete-all-logs') }}" 
      method="POST" 
      style="display: none;">
    @csrf
</form>
@endif 