<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Backpack\CRUD\app\Library\Widget;

class AdminController extends Controller
{
    public function dashboard()
    {
        $this->data['title'] = trans('backpack::base.dashboard');
        $this->data['breadcrumbs'] = [
            trans('backpack::crud.admin')     => backpack_url('dashboard'),
            trans('backpack::base.dashboard') => false,
        ];
        
        // Add the widget to your dashboard
        Widget::add()->to('before_content')->type('div')->class('row')->content([
            Widget::make([
                'type'       => 'div',
                'class'      => 'col-md-6',
                'content'    => [new \App\Widgets\UserReportsWidget()]
            ]),
            Widget::make([
                'type'       => 'div',
                'class'      => 'col-md-6',
                'content'    => [new \App\Widgets\VerificationDocumentsWidget()]
            ]),
        ]);

        return view(backpack_view('dashboard'), $this->data);
    }
} 