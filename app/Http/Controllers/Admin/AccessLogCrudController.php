<?php

namespace App\Http\Controllers\Admin;

use App\Models\AccessLog;
use Backpack\CRUD\app\Http\Controllers\CrudController;
use Backpack\CRUD\app\Library\CrudPanel\CrudPanelFacade as CRUD;
use Illuminate\Support\Facades\Route;
use Backpack\CRUD\app\Http\Controllers\Operations\ListOperation;
use Backpack\CRUD\app\Http\Controllers\Operations\ShowOperation;
use Backpack\CRUD\app\Http\Controllers\Operations\DeleteOperation;
// Remove BulkDeleteOperation as it's a PRO feature
// use Backpack\CRUD\app\Http\Controllers\Operations\BulkDeleteOperation;
// Remove unused Request import if not directly used elsewhere after modification
// use Illuminate\Http\Request;
// Use the standard Session facade for flashing messages
use Illuminate\Support\Facades\Session;
// Keep Alerts if Backpack relies on it for other things or if you prefer its interface
use Prologue\Alerts\Facades\Alert;


class AccessLogCrudController extends CrudController
{
    use ListOperation;
    use ShowOperation;
    use DeleteOperation;
    // Remove BulkDeleteOperation as it's a PRO feature
    // use BulkDeleteOperation;

    public function setup()
    {
        CRUD::setModel(AccessLog::class);
        CRUD::setRoute(config('backpack.base.route_prefix') . '/access-log');
        CRUD::setEntityNameStrings('access log', 'access logs');

        // Add custom button for blocking/unblocking IP
        // Ensure the 'blockIpButton' model function generates the correct POST link to the blockIp route
        $this->crud->addButtonFromModelFunction('line', 'block_ip', 'blockIpButton', 'beginning');
        
        // Add custom button for deleting all logs for a specific IP
        $this->crud->addButtonFromModelFunction('line', 'delete_ip_logs', 'deleteIpLogsButton', 'end');
        
        // Add button to delete all logs (top of the page)
        $this->crud->addButton('top', 'delete_all_logs', 'view', 'vendor.backpack.crud.buttons.delete_all_logs');
        
        // Add buttons to delete logs older than certain periods
        $this->crud->addButton('top', 'delete_old_logs_30', 'view', 'vendor.backpack.crud.buttons.delete_old_logs', ['days' => 30]);
        $this->crud->addButton('top', 'delete_old_logs_90', 'view', 'vendor.backpack.crud.buttons.delete_old_logs', ['days' => 90]);
    }

    protected function setupListOperation()
    {
        CRUD::addColumns([
            [
                'name' => 'ip_address',
                'label' => 'IP Address',
                'type' => 'text',
            ],
            [
                'name' => 'is_admin_attempt',
                'label' => 'Admin Attempt',
                'type' => 'boolean',
                'options' => [0 => 'No', 1 => 'Yes'] // Optional: Better display for boolean
            ],
            [
                'name' => 'is_blocked',
                'label' => 'Blocked',
                'type' => 'boolean',
                'options' => [0 => 'No', 1 => 'Yes'] // Optional: Better display for boolean
            ],
            [
                'name' => 'url',
                'label' => 'URL',
                'type' => 'text',
                'limit' => 50,
            ],
            [
                'name' => 'method',
                'label' => 'Method',
                'type' => 'text',
            ],
            [
                'name' => 'browser',
                'label' => 'Browser',
                'type' => 'text',
            ],
            [
                'name' => 'platform',
                'label' => 'Platform',
                'type' => 'text',
            ],
            [
                'name' => 'visit_count',
                'label' => 'Visit Count',
                'type' => 'number',
            ],
            [
                'name' => 'created_at',
                'label' => 'First Visit',
                'type' => 'datetime',
            ],
            [
                'name' => 'updated_at',
                'label' => 'Last Visit',
                'type' => 'datetime',
            ],
        ]);

        // Add a filter for blocked status (non-PRO version)
        // We can create a simple GET parameter filter
        if (request()->has('blocked')) {
            $this->crud->addClause('where', 'is_blocked', '=', 1);
        }
        
        // Add links to view blocked/all logs
        $this->crud->addButton('top', 'view_blocked', 'view', 'vendor.backpack.crud.buttons.view_blocked');
        $this->crud->addButton('top', 'view_all', 'view', 'vendor.backpack.crud.buttons.view_all');
    }

    protected function setupShowOperation()
    {
        // Use setupListOperation() columns by default for Show, if desired
        // $this->setupListOperation();
        // Or define specific columns for the Show operation:
        CRUD::addColumns([
            [
                'name' => 'ip_address',
                'label' => 'IP Address',
                'type' => 'text',
            ],
            [
                'name' => 'is_admin_attempt',
                'label' => 'Admin Attempt',
                'type' => 'boolean',
                 'options' => [0 => 'No', 1 => 'Yes']
            ],
            [
                'name' => 'is_blocked',
                'label' => 'Blocked',
                'type' => 'boolean',
                 'options' => [0 => 'No', 1 => 'Yes']
            ],
            [
                'name' => 'url',
                'label' => 'URL',
                'type' => 'text',
            ],
            [
                'name' => 'method',
                'label' => 'Method',
                'type' => 'text',
            ],
            [
                'name' => 'user_agent',
                'label' => 'User Agent',
                'type' => 'text',
            ],
            [
                'name' => 'referer',
                'label' => 'Referer',
                'type' => 'text',
            ],
            [
                'name' => 'browser',
                'label' => 'Browser',
                'type' => 'text',
            ],
            [
                'name' => 'platform',
                'label' => 'Platform',
                'type' => 'text',
            ],
            [
                'name' => 'device',
                'label' => 'Device',
                'type' => 'text',
            ],
            [
                'name' => 'visit_count',
                'label' => 'Visit Count',
                'type' => 'number',
            ],
            [
                'name' => 'request_data',
                'label' => 'Request Data',
                'type' => 'array_count', // Or 'array' or 'json' depending on desired display
            ],
            [
                'name' => 'created_at',
                'label' => 'First Visit',
                'type' => 'datetime',
            ],
             [
                'name' => 'updated_at', 
                'label' => 'Last Visit',
                'type' => 'datetime',
            ],
        ]);
    }

    /**
     * Block or unblock ALL entries for a specific IP address based on the selected entry's IP.
     */
    public function blockIp($id)
    {
        // Use findOrFail or check if entry exists cleanly
        $entry = $this->crud->getEntry($id); // $this->crud->model->find($id); might be more direct

        if (!$entry || !$entry->ip_address) {
             // Use the standard Session facade for flashing messages
             Session::flash('error', 'Could not find the selected log entry or it has no IP address.');
             return redirect()->back();
        }

        $ipToToggle = $entry->ip_address;

        // Determine the NEW state based on the state of the entry that was clicked.
        // If this specific entry is currently NOT blocked, the action is to BLOCK the IP.
        // If this specific entry IS currently blocked, the action is to UNBLOCK the IP.
        $newState = !$entry->is_blocked; // true means block, false means unblock

        // Update ALL records matching this IP address to the new state
        $updatedCount = AccessLog::where('ip_address', $ipToToggle)->update(['is_blocked' => $newState]);

        // Show a notification based on the NEW state applied
        if ($newState === true) { // If the IP is now blocked
            Session::flash('success', 'IP address ' . $ipToToggle . ' has been BLOCKED. (' . $updatedCount . ' records updated)');
        } else { // If the IP is now unblocked
            Session::flash('success', 'IP address ' . $ipToToggle . ' has been UNBLOCKED. (' . $updatedCount . ' records updated)');
        }

        return redirect()->back();
    }

    /**
     * Delete all access logs for a specific IP address.
     */
    public function deleteIpLogs($id)
    {
        $entry = $this->crud->getEntry($id);

        if (!$entry || !$entry->ip_address) {
             Session::flash('error', 'Could not find the selected log entry or it has no IP address.');
             return redirect()->back();
        }

        $ipToDelete = $entry->ip_address;
        $deletedCount = AccessLog::where('ip_address', $ipToDelete)->delete();

        Session::flash('success', 'All access logs for IP address ' . $ipToDelete . ' have been deleted. (' . $deletedCount . ' records removed)');
        
        return redirect()->back();
    }
    
    /**
     * Delete all access logs.
     */
    public function deleteAllLogs()
    {
        $deletedCount = AccessLog::truncate();
        
        Session::flash('success', 'All access logs have been deleted.');
        
        return redirect()->back();
    }
    
    /**
     * Delete access logs older than a specific period.
     * 
     * @param int $days Number of days to keep logs for
     * @return \Illuminate\Http\RedirectResponse
     */
    public function deleteOldLogs($days)
    {
        $date = now()->subDays($days);
        $deletedCount = AccessLog::where('created_at', '<', $date)->delete();
        
        Session::flash('success', 'Deleted ' . $deletedCount . ' access logs older than ' . $days . ' days.');
        
        return redirect()->back();
    }

    public function setupRoutes($segment, $routeName, $controller)
    {
        parent::setupRoutes($segment, $routeName, $controller);

        // Ensure this route is correctly defined and accessible
        Route::post($segment.'/{id}/block', [
            'as'        => $routeName.'.blockIp', // Used for route() helper: route('crud.access-log.blockIp', ['id'=>1])
            'uses'      => $controller.'@blockIp',
            'operation' => 'blockIp', // For Backpack internal operation checks/permissions (optional)
        ]);
        
        // Add route for deleting all logs for a specific IP
        Route::post($segment.'/{id}/delete-ip-logs', [
            'as'        => $routeName.'.deleteIpLogs',
            'uses'      => $controller.'@deleteIpLogs',
            'operation' => 'deleteIpLogs',
        ]);
        
        // Add route for deleting all logs
        Route::post($segment.'/delete-all-logs', [
            'as'        => $routeName.'.deleteAllLogs',
            'uses'      => $controller.'@deleteAllLogs',
            'operation' => 'deleteAllLogs',
        ]);
        
        // Add route for deleting old logs
        Route::post($segment.'/delete-old-logs/{days}', [
            'as'        => $routeName.'.deleteOldLogs',
            'uses'      => $controller.'@deleteOldLogs',
            'operation' => 'deleteOldLogs',
        ]);
    }
}
