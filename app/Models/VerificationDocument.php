<?php

namespace App\Models;

use Backpack\CRUD\app\Models\Traits\CrudTrait;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VerificationDocument extends Model
{
    use CrudTrait;
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<string>
     */
    protected $fillable = [
        'user_id',
        'document_path',
        'document_type',
        'notes',
    ];

    protected $table = 'verification_documents';
    protected $guarded = ['id'];

    /**
     * Get the user that owns the verification document.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
} 