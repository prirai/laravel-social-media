<?php

namespace App\Http\Controllers\Admin;

use Backpack\CRUD\app\Http\Controllers\CrudController;
use Backpack\CRUD\app\Library\CrudPanel\CrudPanelFacade as CRUD;

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
        
        // Update the user
        $user = CRUD::getCurrentEntry();
        $user->update($data);
        
        return redirect()->back();
    }
}
