<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\VerificationDocument;
use Backpack\CRUD\app\Http\Controllers\CrudController;
use Backpack\CRUD\app\Library\CrudPanel\CrudPanelFacade as CRUD;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;

class VerificationCrudController extends CrudController
{
    use \Backpack\CRUD\app\Http\Controllers\Operations\ListOperation;
    use \Backpack\CRUD\app\Http\Controllers\Operations\ShowOperation;

    public function setup()
    {
        $this->crud->setModel(VerificationDocument::class);
        $this->crud->setRoute(config('backpack.base.route_prefix') . '/verification-document');
        $this->crud->setEntityNameStrings('verification document', 'verification documents');
    }

    protected function setupListOperation()
    {
        $this->crud->addColumns([
            [
                'name' => 'user.name',
                'label' => 'User',
                'type' => 'text',
            ],
            [
                'name' => 'document_path',
                'label' => 'Document',
                'type' => 'closure',
                'function' => function($entry) {
                    $url = asset('storage/' . $entry->document_path);
                    return '<a href="'.$url.'" target="_blank" class="btn btn-sm btn-primary">
                        <i class="la la-eye"></i> Preview Document
                    </a>';
                },
                'escaped' => false
            ],
            [
                'name' => 'user.verification_status',
                'label' => 'Status',
                'type' => 'closure',
                'function' => function($entry) {
                    if ($entry->user->verification_status === 'verified') {
                        return '<span class="badge bg-success"><i class="la la-check"></i> Verified</span>';
                    }
                    return '<span class="badge bg-warning">Unverified</span>';
                },
                'escaped' => false
            ],
            [
                'name' => 'verify_button',
                'label' => 'Actions',
                'type' => 'closure',
                'function' => function($entry) {
                    if ($entry->user->verification_status !== 'verified') {
                        return '<button
                            type="button"
                            class="btn btn-sm btn-success verify-user-btn"
                            data-id="'.$entry->user->id.'">
                            <i class="la la-check"></i> Approve User
                        </button>';
                    }
                    return '';
                },
                'escaped' => false
            ],
        ]);

        $this->crud->addClause('with', 'user');

        // Move the scripts to a separate blade view
        $this->crud->set('list.scripts', view('vendor.backpack.crud.list.verification_scripts')->render());
    }

    public function setupRoutes($segment, $routeName, $controller)
    {
        parent::setupRoutes($segment, $routeName, $controller);

        Route::post($segment.'/verify-user/{userId}', [
            'as' => $routeName.'.verifyUser',
            'uses' => $controller.'@verifyUser',
        ]);
    }

    /**
     * @param $userId
     * @return JsonResponse
     */
    public function verifyUser($userId)
    {
        try {
            \DB::table('users')
                ->where('id', $userId)
                ->update(['verification_status' => 'verified']);

            return response()->json([
                'success' => true,
                'message' => 'User verified successfully'
            ]);
        } catch (\Exception $e) {
            \Log::error('User verification error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error verifying user'
            ], 500);
        }
    }
}
