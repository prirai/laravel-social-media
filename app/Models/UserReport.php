<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Backpack\CRUD\app\Models\Traits\CrudTrait;

class UserReport extends Model
{
    use CrudTrait;

    protected $fillable = [
        'reported_user_id',
        'reporter_id',
        'reason',
        'status'
    ];

    public function reportedUser()
    {
        return $this->belongsTo(User::class, 'reported_user_id');
    }

    public function reporter()
    {
        return $this->belongsTo(User::class, 'reporter_id');
    }

    // Helper method to get status classes for the admin panel
    public function getStatusClass()
    {
        return [
            'pending' => 'warning',
            'reviewed' => 'info',
            'resolved' => 'success',
            'dismissed' => 'danger',
        ][$this->status] ?? 'secondary';
    }

    // Accessor for formatted status
    public function getStatusBadgeAttribute()
    {
        $class = $this->getStatusClass();
        return "<span class='badge badge-{$class}'>{$this->status}</span>";
    }

    public function deleteUserButton()
    {
        if ($this->reportedUser) {
            return '<a href="'.route('admin.delete-reported-user', $this->reported_user_id).'" 
                      class="btn btn-sm btn-danger" 
                      onclick="return confirm(\'Are you sure you want to delete this user? This action cannot be undone.\')"
                   >
                      <i class="la la-trash"></i> Delete User
                   </a>';
        }
        return '';
    }
} 