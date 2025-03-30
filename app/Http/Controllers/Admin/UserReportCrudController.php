<?php

namespace App\Http\Controllers\Admin;

use App\Models\UserReport;
use Backpack\CRUD\app\Http\Controllers\CrudController;
use Backpack\CRUD\app\Library\CrudPanel\CrudPanelFacade as CRUD;

class UserReportCrudController extends CrudController
{
    use \Backpack\CRUD\app\Http\Controllers\Operations\ListOperation;
    use \Backpack\CRUD\app\Http\Controllers\Operations\ShowOperation;
    use \Backpack\CRUD\app\Http\Controllers\Operations\DeleteOperation;

    public function setup()
    {
        CRUD::setModel(UserReport::class);
        CRUD::setRoute(config('backpack.base.route_prefix') . '/user-report');
        CRUD::setEntityNameStrings('user report', 'user reports');
    }

    protected function setupListOperation()
    {
        CRUD::addColumns([
            [
                'name'      => 'reportedUser.username',
                'label'     => 'Reported User',
                'type'      => 'text',
            ],
            [
                'name'      => 'reporter.username',
                'label'     => 'Reported By',
                'type'      => 'text',
            ],
            [
                'name' => 'reason',
                'label' => 'Reason',
                'type' => 'text',
            ],
            [
                'name' => 'status',
                'label' => 'Status',
                'type' => 'select_from_array',
                'options' => [
                    'pending' => 'Pending',
                    'reviewed' => 'Reviewed',
                    'resolved' => 'Resolved',
                    'dismissed' => 'Dismissed',
                ],
            ],
            [
                'name' => 'created_at',
                'label' => 'Reported On',
                'type' => 'datetime',
            ],
        ]);

        CRUD::addButtonFromModelFunction('line', 'delete_user', 'deleteUserButton', 'beginning');
    }

    protected function setupShowOperation()
    {
        // Reuse the list configuration
        $this->setupListOperation();
    }

    protected function setupUpdateOperation()
    {
        // Only allow updating the status
        CRUD::addField([
            'name' => 'status',
            'label' => 'Status',
            'type' => 'select_from_array',
            'options' => [
                'pending' => 'Pending',
                'reviewed' => 'Reviewed',
                'resolved' => 'Resolved',
                'dismissed' => 'Dismissed',
            ],
        ]);
    }

    public function deleteReportedUser($userId)
    {
        try {
            \DB::beginTransaction();
            
            $user = \App\Models\User::find($userId);
            
            if ($user) {
                // Delete or reassign groups created by this user
                \App\Models\Group::where('created_by', $userId)->update([
                    'created_by' => null // Or some default admin user ID
                ]);

                // Delete user's group memberships
                \DB::table('group_user')->where('user_id', $userId)->delete();
                
                // Delete user's messages
                \DB::table('messages')->where('sender_id', $userId)->delete();
                
                // Delete reports related to this user
                UserReport::where('reported_user_id', $userId)
                         ->orWhere('reporter_id', $userId)
                         ->delete();
                
                // Finally delete the user
                $user->delete();
                
                \DB::commit();
                \Alert::success('User and all related data have been deleted.')->flash();
            } else {
                \Alert::error('User not found.')->flash();
            }
        } catch (\Exception $e) {
            \DB::rollBack();
            \Alert::error('Could not delete user: ' . $e->getMessage())->flash();
        }
        
        return redirect()->back();
    }
} 