<?php

namespace App\Http\Controllers\Admin;

use Backpack\CRUD\app\Http\Controllers\CrudController;
use Backpack\CRUD\app\Library\CrudPanel\CrudPanelFacade as CRUD;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\BlockchainController;
use App\Models\Group;

/**
 * Class UserCrudController
 * @package App\Http\Controllers\Admin
 * @property-read \Backpack\CRUD\app\Library\CrudPanel\CrudPanel $crud
 */
class UserCrudController extends CrudController
{
    use \Backpack\CRUD\app\Http\Controllers\Operations\ListOperation;
    use \Backpack\CRUD\app\Http\Controllers\Operations\CreateOperation;
    use \Backpack\CRUD\app\Http\Controllers\Operations\UpdateOperation;
    use \Backpack\CRUD\app\Http\Controllers\Operations\DeleteOperation;
    use \Backpack\CRUD\app\Http\Controllers\Operations\ShowOperation;

    /**
     * Configure the CrudPanel object. Apply settings to all operations.
     * 
     * @return void
     */
    public function setup()
    {
        CRUD::setModel(\App\Models\User::class);
        CRUD::setRoute(config('backpack.base.route_prefix') . '/user');
        CRUD::setEntityNameStrings('user', 'users');
    }

    /**
     * Define what happens when the List operation is loaded.
     * 
     * @see  https://backpackforlaravel.com/docs/crud-operation-list-entries
     * @return void
     */
    protected function setupListOperation()
    {
        // Remove the setFromDb() line and replace with specific columns
        CRUD::addColumns([
            'id',
            'name',
            'email',
        ]);

        // Add email verification status column
        CRUD::addColumn([
            'name' => 'email_verified',
            'label' => 'Email Verified',
            'type' => 'closure',
            'function' => function($entry) {
                $verified = $entry->email_verified_at !== null;
                $color = $verified ? 'success' : 'danger';
                $text = $verified ? 'Verified' : 'Not Verified';
                
                // Add buttons based on verification status
                $button = '';
                if (!$verified) {
                    $url = backpack_url('user/verify-email/'.$entry->id);
                    $button = ' <a href="'.$url.'" class="btn btn-sm btn-success ml-2">
                        <i class="la la-check"></i> Verify
                    </a>';
                } else {
                    $url = backpack_url('user/unverify-email/'.$entry->id);
                    $button = ' <a href="'.$url.'" class="btn btn-sm btn-danger ml-2" onclick="return confirm(\'Are you sure you want to unverify this email?\')">
                        <i class="la la-times"></i> Unverify
                    </a>';
                }
                
                return '<span class="badge bg-'.$color.'">' . $text . '</span>' . $button;
            },
            'escaped' => false
        ]);

        // Add verification document column
        CRUD::addColumn([
            'name' => 'verification_document',
            'label' => 'Document',
            'type' => 'closure',
            'function' => function($entry) {
                // Get the latest verification document
                $document = $entry->verificationDocuments()->latest()->first();
                if ($document) {
                    $url = asset('storage/' . $document->document_path);
                    return '<a href="'.$url.'" target="_blank" class="btn btn-sm btn-primary">
                        <i class="la la-eye"></i> Preview Document
                    </a>';
                }
                return '<span class="text-muted">No document</span>';
            },
            'escaped' => false
        ]);

        CRUD::addColumn([
            'name' => 'verification_status',
            'label' => 'Verification Status',
            'type' => 'closure',
            'function' => function($entry) {
                $colors = [
                    'unverified' => 'secondary',
                    'pending' => 'warning',
                    'verified' => 'success'
                ];
                $color = $colors[$entry->verification_status] ?? 'secondary';
                return '<span class="badge bg-'.$color.'">' . ucfirst($entry->verification_status) . '</span>';
            },
            'escaped' => false
        ]);

        /**
         * Columns can be defined using the fluent syntax:
         * - CRUD::column('price')->type('number');
         */
    }

    /**
     * Define what happens when the Create operation is loaded.
     * 
     * @see https://backpackforlaravel.com/docs/crud-operation-create
     * @return void
     */
    protected function setupCreateOperation()
    {
        CRUD::setFromDb(); // set fields from db columns.

        // Remove the automatic verification_status field
        CRUD::removeField('verification_status');
        
        // Add email verification field
        CRUD::addField([
            'name' => 'email_verified',
            'label' => 'Email Verified',
            'type' => 'checkbox',
            'hint' => 'If checked, the user\'s email will be marked as verified',
        ]);

        // Add the custom dropdown
        CRUD::addField([
            'name' => 'verification_status',
            'label' => 'Verification Status',
            'type' => 'select_from_array',
            'options' => [
                'unverified' => 'Unverified',
                'pending' => 'Pending',
                'verified' => 'Verified'
            ],
            'default' => 'unverified',
            'allows_null' => false,
        ]);

        // Modify password field for create operation
        CRUD::field('password')->type('password');
    }

    /**
     * Define what happens when the Update operation is loaded.
     * 
     * @see https://backpackforlaravel.com/docs/crud-operation-update
     * @return void
     */
    protected function setupUpdateOperation()
    {
        // Start fresh instead of using setupCreateOperation
        CRUD::setFromDb();
        
        // Remove the automatic verification_status field
        CRUD::removeField('verification_status');
        
        // Add email verification field
        CRUD::addField([
            'name' => 'email_verified',
            'label' => 'Email Verified',
            'type' => 'checkbox',
            'hint' => 'If checked, the user\'s email will be marked as verified',
        ]);
        
        // Add the custom dropdown
        CRUD::addField([
            'name' => 'verification_status',
            'label' => 'Verification Status',
            'type' => 'select_from_array',
            'options' => [
                'unverified' => 'Unverified',
                'pending' => 'Pending',
                'verified' => 'Verified'
            ],
            'allows_null' => false,
        ]);

        // Add optional password field for update operation
        CRUD::addField([
            'name' => 'password',
            'label' => 'Password',
            'type' => 'password',
            'hint' => 'Leave blank to keep the same password',
            'validationRules' => 'nullable|min:8',
        ]);

        // Add password confirmation if needed
        CRUD::addField([
            'name' => 'password_confirmation',
            'label' => 'Password Confirmation',
            'type' => 'password',
            'hint' => 'Leave blank to keep the same password',
            'validationRules' => 'nullable|same:password',
        ]);
    }

    /**
     * Update the specified resource in the database.
     *
     * @return \Illuminate\Http\RedirectResponse
     */
    public function update()
    {
        $data = CRUD::getRequest()->all();
        
        // If password is empty, remove it from the data
        if (empty($data['password'])) {
            unset($data['password']);
        }
        
        // If password is provided, hash it
        if (!empty($data['password'])) {
            $data['password'] = bcrypt($data['password']);
        }
        
        // Remove password confirmation as it's not needed in the database
        unset($data['password_confirmation']);
        
        // Handle email verification
        if (isset($data['email_verified']) && $data['email_verified'] == '1') {
            $data['email_verified_at'] = now();
        } elseif (isset($data['email_verified']) && $data['email_verified'] == '0') {
            $data['email_verified_at'] = null;
        }
        unset($data['email_verified']);
        
        // Update the user
        $user = CRUD::getCurrentEntry();
        $oldStatus = $user->verification_status;
        $user->update($data);
        
        // If verification status changed to verified, create a blockchain block
        if ($oldStatus !== 'verified' && $data['verification_status'] === 'verified') {
            $blockchainController = app(BlockchainController::class);
            $blockchainController->verifyUser($user);
        }
        
        // return redirect()->back();
        return redirect(backpack_url('user'));

    }
    
    /**
     * Verify a user's email address
     *
     * @param int $id
     * @return \Illuminate\Http\RedirectResponse
     */
    public function verifyEmail($id)
    {
        $user = \App\Models\User::findOrFail($id);
        $user->email_verified_at = now();
        $user->save();
        
        \Alert::success('Email verified successfully.')->flash();
        return redirect()->back();
    }
    
    /**
     * Unverify a user's email address
     *
     * @param int $id
     * @return \Illuminate\Http\RedirectResponse
     */
    public function unverifyEmail($id)
    {
        $user = \App\Models\User::findOrFail($id);
        $user->email_verified_at = null;
        $user->save();
        
        \Alert::success('Email unverified successfully.')->flash();
        return redirect()->back();
    }

    /**
     * Define what happens when the Delete operation is loaded.
     * 
     * @see https://backpackforlaravel.com/docs/crud-operation-delete
     * @return void
     */
    protected function setupDeleteOperation()
    {
        $this->crud->set('showDeleteButton', true);
        
        // Override the delete operation to handle group admin deletion
        $this->crud->setOperationSetting('delete', function ($entry) {
            // Start a transaction to ensure data consistency
            DB::beginTransaction();
            
            try {
                // Get all groups where the user is the creator
                $groups = Group::where('created_by', $entry->id)->get();
                
                foreach ($groups as $group) {
                    // Get all members of the group
                    $members = $group->users()->where('users.id', '!=', $entry->id)->get();
                    
                    if ($members->isNotEmpty()) {
                        // Transfer admin rights to the first other member
                        $newAdmin = $members->first();
                        $group->created_by = $newAdmin->id;
                        $group->save();
                    } else {
                        // If no other members, delete the group
                        $group->delete();
                    }
                    
                    // Remove the user from the group
                    $group->users()->detach($entry->id);
                }
                
                // Now delete the user
                $entry->delete();
                
                DB::commit();
                return true;
            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }
        });
    }
}
