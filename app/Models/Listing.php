<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Listing extends Model
{
    protected $fillable = [
        'user_id',
        'title',
        'price',
        'category',
        'description',
        'images',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'images' => 'array',
    ];

    public function seller(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
} 