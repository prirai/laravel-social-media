<?php

namespace App\Http\Controllers\Admin;

use App\Models\Post;
use Backpack\CRUD\app\Http\Controllers\CrudController;
use Backpack\CRUD\app\Library\CrudPanel\CrudPanelFacade as CRUD;

class PostCrudController extends CrudController
{
    use \Backpack\CRUD\app\Http\Controllers\Operations\ListOperation;
    use \Backpack\CRUD\app\Http\Controllers\Operations\ShowOperation;
    use \Backpack\CRUD\app\Http\Controllers\Operations\DeleteOperation;

    public function setup()
    {
        CRUD::setModel(Post::class);
        CRUD::setRoute(config('backpack.base.route_prefix') . '/post');
        CRUD::setEntityNameStrings('post', 'posts');
    }

    protected function setupListOperation()
    {
        CRUD::addColumns([
            [
                'name' => 'id',
                'label' => 'Post ID',
                'type' => 'text',
            ],
            [
                'name' => 'user.name',
                'label' => 'Posted By',
                'type' => 'text',
            ],
            [
                'name' => 'content',
                'label' => 'Content',
                'type' => 'text',
                'limit' => 200,
            ],
            [
                'name' => 'created_at',
                'label' => 'Posted At',
                'type' => 'datetime',
            ],
            [
                'name' => 'attachments',
                'label' => 'Attachments',
                'type' => 'closure',
                'function' => function($entry) {
                    if (!$entry->attachments || !is_array($entry->attachments)) {
                        return '<span class="text-muted">No attachments</span>';
                    }

                    $html = '<div class="d-flex flex-wrap gap-2">';
                    foreach ($entry->attachments as $attachment) {
                        // Use the attachment path as is, without modifying the '/1/'
                        $html .= '<a href="'.$attachment.'" target="_blank" class="btn btn-sm btn-primary">
                            <i class="la la-eye"></i> Preview Document
                        </a>';
                    }
                    $html .= '</div>';
                    return $html;
                },
                'escaped' => false
            ],
            [
                'name' => 'likes_count',
                'label' => 'Likes',
                'type' => 'closure',
                'function' => function($entry) {
                    return $entry->likes()->count();
                }
            ],
            [
                'name' => 'comments_count',
                'label' => 'Comments',
                'type' => 'closure',
                'function' => function($entry) {
                    return $entry->comments()->count();
                }
            ],
        ]);
    }

    protected function setupShowOperation()
    {
        $this->setupListOperation();
    }
} 