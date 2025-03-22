<?php

namespace App\Models;

use Backpack\CRUD\app\Models\Traits\CrudTrait;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Listing extends Model
{
    use CrudTrait;

    protected $fillable = [
        'title',
        'price',
        'category',
        'description',
        'status',
        'user_id',
        'images',
    ];

    protected $casts = [
        'images' => 'array',
        'price' => 'float',
    ];

    public function seller(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function verifyButton()
    {
        if ($this->status === 'unverified') {
            return '<a href="'.route('admin.verify-listing', $this->id).'" 
                      class="btn btn-sm btn-success" 
                      onclick="return confirm(\'Are you sure you want to verify this listing?\')"
                   >
                      <i class="la la-check"></i> Verify
                   </a>';
        }
        return '';
    }
} 