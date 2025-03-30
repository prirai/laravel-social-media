<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GroupMessageAttachment extends Model
{
    use HasFactory;

    protected $fillable = ['group_message_id', 'file_path', 'file_type', 'file_name', 'file_size'];

    public function message(): BelongsTo
    {
        return $this->belongsTo(GroupMessage::class, 'group_message_id');
    }
} 