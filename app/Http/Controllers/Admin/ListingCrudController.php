<?php

namespace App\Http\Controllers\Admin;

use App\Models\Listing;
use Backpack\CRUD\app\Http\Controllers\CrudController;
use Backpack\CRUD\app\Library\CrudPanel\CrudPanelFacade as CRUD;

class ListingCrudController extends CrudController
{
    use \Backpack\CRUD\app\Http\Controllers\Operations\ListOperation;
    use \Backpack\CRUD\app\Http\Controllers\Operations\ShowOperation;
    use \Backpack\CRUD\app\Http\Controllers\Operations\DeleteOperation;

    public function setup()
    {
        CRUD::setModel(Listing::class);
        CRUD::setRoute(config('backpack.base.route_prefix') . '/listing');
        CRUD::setEntityNameStrings('listing', 'listings');
    }

    protected function setupListOperation()
    {
        CRUD::addColumns([
            [
                'name' => 'title',
                'label' => 'Title',
                'type' => 'text',
            ],
            [
                'name' => 'price',
                'label' => 'Price',
                'type' => 'number',
                'prefix' => '$',
            ],
            [
                'name' => 'category',
                'label' => 'Category',
                'type' => 'text',
            ],
            [
                'name' => 'seller.username',
                'label' => 'Seller',
                'type' => 'text',
            ],
            [
                'name' => 'status',
                'label' => 'Status',
                'type' => 'text',
                'wrapper' => [
                    'element' => 'span',
                    'class' => function ($crud, $column, $entry) {
                        return 'badge badge-' . ($entry->status === 'verified' ? 'success' : 'warning');
                    }
                ],
            ],
            [
                'name' => 'created_at',
                'label' => 'Created',
                'type' => 'datetime',
            ],
        ]);

        // Add custom buttons
        CRUD::addButtonFromModelFunction('line', 'verify', 'verifyButton', 'beginning');
    }

    public function verifyListing($id)
    {
        $listing = Listing::findOrFail($id);
        $listing->update(['status' => 'verified']);

        \Alert::success('Listing has been verified.')->flash();
        return redirect()->back();
    }
} 