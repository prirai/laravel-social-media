<?php

namespace App\Http\Controllers\Admin;

use App\Models\User; // <-- Import User model
use App\Models\Group; // <-- Import Group model
use App\Models\UserReport;
use Backpack\CRUD\app\Http\Controllers\CrudController;
use Backpack\CRUD\app\Library\CrudPanel\CrudPanelFacade as CRUD;
use Illuminate\Support\Facades\DB; // <-- Import DB facade
use Illuminate\Support\Facades\Log; // <-- Import Log facade
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule; // <-- Import Rule facade
use Prologue\Alerts\Facades\Alert; // <-- Import Alert facade (assuming prologue/alerts is used)


class UserReportCrudController extends CrudController
{
    use \Backpack\CRUD\app\Http\Controllers\Operations\ListOperation;
    use \Backpack\CRUD\app\Http\Controllers\Operations\ShowOperation;
    use \Backpack\CRUD\app\Http\Controllers\Operations\DeleteOperation;
    use \Backpack\CRUD\app\Http\Controllers\Operations\UpdateOperation; // <-- Add UpdateOperation use statement

    public function setup() : void // Added return type hint
    {
        CRUD::setModel(UserReport::class);
        CRUD::setRoute(config('backpack.base.route_prefix') . '/user-report');
        CRUD::setEntityNameStrings('user report', 'user reports');
    }

    /**
     * Define what happens when the List operation is loaded.
     *
     * @return void
     */
    protected function setupListOperation() : void // Added return type hint
    {
        CRUD::addColumns([
            [
                'name'      => 'reportedUser.username',
                'label'     => 'Reported User',
                'type'      => 'relationship',
                'attribute' => 'username',
                'entity'    => 'reportedUser', // Make it clickable
                'searchLogic' => function ($query, $column, $searchTerm) {
                    $query->orWhereHas('reportedUser', function ($q) use ($searchTerm) {
                        $q->where('username', 'like', '%'.$searchTerm.'%')
                          ->orWhere('name', 'like', '%'.$searchTerm.'%');
                    });
                }
            ],
            [
                'name'      => 'reporter.username',
                'label'     => 'Reported By',
                'type'      => 'relationship',
                'attribute' => 'username',
                'entity'    => 'reporter', // Make it clickable
                'searchLogic' => function ($query, $column, $searchTerm) {
                    $query->orWhereHas('reporter', function ($q) use ($searchTerm) {
                        $q->where('username', 'like', '%'.$searchTerm.'%')
                          ->orWhere('name', 'like', '%'.$searchTerm.'%');
                    });
                }
            ],
            [
                'name' => 'category_name', // Use the accessor
                'label' => 'Category',
                'type' => 'text',
                'searchLogic' => function ($query, $column, $searchTerm) {
                     // Simple search on the category key
                     $query->orWhere('category', 'like', '%'.$searchTerm.'%');
                     // Or search based on the display names if needed (more complex)
                }
            ],
            [
                'name' => 'reason',
                'label' => 'Reason',
                'type' => 'text',
                'limit' => 150, // Limit display length
            ],
            [ // <-- Use the new button accessor for the list view
                 'name' => 'attachment_preview_button', // Use the new button accessor
                 'label' => 'Attachment',
                 'type' => 'closure', // Display as HTML
                 'function'  => function($entry) { // $entry is the current UserReport model instance
                                      if ($entry->attachment_path) {
                                          $url = Storage::url($entry->attachment_path); // Generate URL
                                          $fileName = basename($entry->attachment_path);

                                          // Determine icon (same logic as accessor)
                                          $iconClass = 'la-file';
                                          $extension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
                                          if (in_array($extension, ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'])) {
                                              $iconClass = 'la-image';
                                          } elseif ($extension === 'pdf') {
                                              $iconClass = 'la-file-pdf';
                                          } elseif (in_array($extension, ['doc', 'docx'])) {
                                              $iconClass = 'la-file-word';
                                          }

                                          // Return the button HTML
                                          return '<a href="'.$url.'" target="_blank" class="btn btn-sm btn-primary">
                                              <i class="la la-eye"></i> Preview Document
                                          </a>';
                                      }
                                      // Return placeholder if no attachment
                                      return '<span class="text-muted">N/A</span>';
                                  },
                                  'escaped' => false // IMPORTANT: Render the returned HTML
                             ],
            [
                'name' => 'status_badge', // Use the accessor
                'label' => 'Status',
                'type' => 'html', // Display as HTML
                'escaped' => false,
                'searchLogic' => function ($query, $column, $searchTerm) {
                     $query->orWhere('status', 'like', '%'.$searchTerm.'%');
                }
            ],
            [
                'name' => 'created_at',
                'label' => 'Reported On',
                'type' => 'datetime',
            ],
        ]);

        CRUD::addButtonFromModelFunction('line', 'delete_user', 'deleteUserButton', 'beginning');


    }

    /**
     * Define what happens when the Show operation is loaded.
     *
     * @return void
     */
    protected function setupShowOperation() : void // Added return type hint
    {
        // Almost same as list, but don't limit reason text
         CRUD::set('show.setFromDb', false); // Disable auto-fields

        // Define columns specifically for Show or reuse/modify List setup
         CRUD::addColumns([
             [
                'name'      => 'reportedUser.username',
                'label'     => 'Reported User',
                'type'      => 'relationship',
                'attribute' => 'username',
                'entity'    => 'reportedUser',
             ],
             [
                'name'      => 'reporter.username',
                'label'     => 'Reported By',
                'type'      => 'relationship',
                'attribute' => 'username',
                'entity'    => 'reporter',
             ],
             [
                'name' => 'category_name',
                'label' => 'Category',
                'type' => 'text',
             ],
             [
                 'name' => 'reason',
                 'label' => 'Reason',
                 'type' => 'textarea', // Show full reason
             ],
             [ // <-- Use the new button accessor for the show view as well
                 'name' => 'attachment_preview_button', // Use the new button accessor
                 'label' => 'Attachment',
                 'type' => 'html',
                 'escaped' => false,
             ],
             [
                 'name' => 'status_badge',
                 'label' => 'Status',
                 'type' => 'html',
                 'escaped' => false,
             ],
             [
                 'name' => 'created_at',
                 'label' => 'Reported On',
                 'type' => 'datetime',
             ],
              [
                 'name' => 'updated_at',
                 'label' => 'Last Updated',
                 'type' => 'datetime',
             ],
         ]);
    }

     /**
      * Define what happens when the Update operation is loaded.
      *
      * @return void
      */
    protected function setupUpdateOperation() : void // Added return type hint
    {
         // Define validation rules using the Rule facade
         CRUD::setValidation([
             'status' => ['required', Rule::in(['pending', 'reviewed', 'resolved', 'dismissed'])],
             'category' => ['required', 'string', Rule::in(array_keys(UserReport::CATEGORIES))],
         ]);


        // Allow updating status and category
        CRUD::addField([
            'name' => 'status',
            'label' => 'Status',
            'type' => 'select_from_array',
             // Combine existing statuses with standard ones
             'options' => array_merge(
                 // Use static query method for UserReport
                 UserReport::query()->select('status')->distinct()->pluck('status', 'status')->toArray(),
                 [
                     'pending' => 'Pending',
                     'reviewed' => 'Reviewed',
                     'resolved' => 'Resolved',
                     'dismissed' => 'Dismissed',
                 ]
             ),
            'allows_null' => false,
        ]);
        CRUD::addField([
                    'name' => 'category',
                    'label' => 'Category',
                    'type' => 'select_from_array', // <-- Use the standard field type
                    'options' => UserReport::CATEGORIES,
                    'allows_null' => false,
                ]);
         // Display reason and attachment non-editable
         CRUD::addField([
             'name' => 'reason',
             'label' => 'Reason',
             'type' => 'textarea',
             'attributes' => [
                 'readonly' => 'readonly',
                 'rows' => 5,
             ]
         ]);
          CRUD::addField([
             'name' => 'attachment_link', // Use the original link accessor here
             'label' => 'Attachment',
             'type' => 'custom_html', // Display as HTML
             // Fetch the value using the accessor on the current entry
             'value' => $this->crud->getCurrentEntry()?->attachment_link ?? 'No attachment',
         ]);
          CRUD::addField([
              'name' => 'reportedUser.username',
              'label' => 'Reported User',
              'type' => 'text',
              'attributes' => ['readonly' => 'readonly']
          ]);
           CRUD::addField([
              'name' => 'reporter.username',
              'label' => 'Reporter',
              'type' => 'text',
              'attributes' => ['readonly' => 'readonly']
          ]);


    }

    /**
     * Delete a reported user and their associated data.
     *
     * @param int|string $userId The ID of the user to delete.
     * @return \Illuminate\Http\RedirectResponse
     */
    public function deleteReportedUser(int|string $userId): \Illuminate\Http\RedirectResponse // Added type hint and return type
    {
        try {
            DB::beginTransaction(); // Use DB facade

            // Use Eloquent findOrFail to throw exception if not found
            $user = User::findOrFail($userId);

            // Delete or reassign groups created by this user
            // Use Eloquent query builder
            Group::query()->where('created_by', $userId)->update([
                'created_by' => null // Or some default admin user ID
            ]);

            // Delete user's group memberships
            DB::table('group_user')->where('user_id', $userId)->delete(); // DB facade is fine here

            // Delete user's messages (assuming Message model exists, otherwise DB is fine)
             // If Message model exists: \App\Models\Message::where('sender_id', $userId)->delete();
             DB::table('messages')->where('sender_id', $userId)->delete(); // Keep using DB if no Message model or preferred

            // Delete reports related to this user
            // Use Eloquent query builder
            UserReport::query()->where('reported_user_id', $userId)
                     ->orWhere('reporter_id', $userId)
                     ->delete();

            // Finally delete the user
            $user->delete();

            DB::commit(); // Use DB facade
             Alert::success('User and all related data have been deleted.')->flash(); // Use Alert facade

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            DB::rollBack(); // Ensure rollback even if findOrFail fails (though unlikely to reach here if it fails)
            Log::warning('Attempted to delete non-existent user.', ['userId' => $userId]);
            Alert::error('User not found.')->flash(); // Use Alert facade
        } catch (\Exception $e) {
            DB::rollBack(); // Use DB facade
             Log::error('Could not delete user: ' . $e->getMessage(), ['exception' => $e, 'userId' => $userId]); // Log exception context
             Alert::error('Could not delete user. Check logs for details.')->flash(); // Use Alert facade
        }

        return redirect()->back();
    }
}
