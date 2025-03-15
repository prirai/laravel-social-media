<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Attachment extends Model
{
    use HasFactory;

    protected $fillable = ['post_id', 'file_path', 'file_type', 'file_name', 'file_size'];

    public function post(): BelongsTo
    {
        return $this->belongsTo(Post::class);
    }
}
