<?php

namespace App\Http\Controllers\Admin;

use App\Models\AccessLog;
use Backpack\CRUD\app\Http\Controllers\CrudController;
use Backpack\CRUD\app\Library\CrudPanel\CrudPanelFacade as CRUD;
use Illuminate\Support\Facades\Route;
use Backpack\CRUD\app\Http\Controllers\Operations\ListOperation;
use Backpack\CRUD\app\Http\Controllers\Operations\ShowOperation;
use Illuminate\Http\Request;
use Prologue\Alerts\Facades\Alert;

class AccessLogCrudController extends CrudController
{
    use ListOperation;
    use ShowOperation;

    public function setup()
    {
        CRUD::setModel(AccessLog::class);
        CRUD::setRoute(config('backpack.base.route_prefix') . '/access-log');
        CRUD::setEntityNameStrings('access log', 'access logs');
        
        // Add custom button for blocking/unblocking IP
        $this->crud->addButtonFromModelFunction('line', 'block_ip', 'blockIpButton', 'beginning');
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
            ],
            [
                'name' => 'is_blocked',
                'label' => 'Blocked',
                'type' => 'boolean',
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
                'name' => 'country',
                'label' => 'Country',
                'type' => 'text',
            ],
            [
                'name' => 'city',
                'label' => 'City',
                'type' => 'text',
            ],
            [
                'name' => 'created_at',
                'label' => 'Time',
                'type' => 'datetime',
            ],
        ]);

        // Remove filters as they are a Backpack PRO feature
    }

    protected function setupShowOperation()
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
            ],
            [
                'name' => 'is_blocked',
                'label' => 'Blocked',
                'type' => 'boolean',
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
                'name' => 'country',
                'label' => 'Country',
                'type' => 'text',
            ],
            [
                'name' => 'city',
                'label' => 'City',
                'type' => 'text',
            ],
            [
                'name' => 'request_data',
                'label' => 'Request Data',
                'type' => 'array',
            ],
            [
                'name' => 'created_at',
                'label' => 'Time',
                'type' => 'datetime',
            ],
        ]);
    }

    /**
     * Block or unblock an IP address
     */
    public function blockIp($id)
    {
        $entry = $this->crud->getEntry($id);
        
        if ($entry) {
            // Toggle the blocked status
            $entry->is_blocked = !$entry->is_blocked;
            $entry->save();
            
            // Show a notification
            if ($entry->is_blocked) {
                $this->crud->getRequest()->session()->flash('success', 'IP address ' . $entry->ip_address . ' has been blocked.');
            } else {
                $this->crud->getRequest()->session()->flash('success', 'IP address ' . $entry->ip_address . ' has been unblocked.');
            }
        }
        
        return redirect()->back();
    }

    public function setupRoutes($segment, $routeName, $controller)
    {
        parent::setupRoutes($segment, $routeName, $controller);
        
        Route::post($segment.'/{id}/block', [
            'as'        => $routeName.'.blockIp',
            'uses'      => $controller.'@blockIp',
            'operation' => 'blockIp',
        ]);
    }
}
