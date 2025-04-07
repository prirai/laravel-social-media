<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Backpack\CRUD\app\Models\Traits\CrudTrait;
use Illuminate\Database\Eloquent\Relations\BelongsTo; // Import BelongsTo
use Illuminate\Support\Facades\Storage; // Import Storage facade

class UserReport extends Model
{
    use CrudTrait;

    protected $fillable = [
        'reported_user_id',
        'reporter_id',
        'category', // Add category
        'reason',
        'attachment_path', // Add attachment_path
        'status'
    ];

    // Define report categories (adjust as needed)
    public const CATEGORIES = [
        'spam' => 'Spam or Misleading',
        'harassment' => 'Harassment or Bullying',
        'hate_speech' => 'Hate Speech',
        'impersonation' => 'Impersonation',
        'inappropriate_content' => 'Inappropriate Content',
        'other' => 'Other', // Keep 'other' generic
    ];


    public function reportedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reported_user_id');
    }

    public function reporter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reporter_id');
    }

    // Helper method to get status classes for the admin panel
    public function getStatusClass(): string
    {
        return [
            'pending' => 'warning',
            'reviewed' => 'info',
            'resolved' => 'success',
            'dismissed' => 'danger',
        ][$this->status] ?? 'secondary';
    }

    // Accessor for formatted status
    public function getStatusBadgeAttribute(): string
    {
        $class = $this->getStatusClass();
        $statusText = ucfirst($this->status); // Nicer display
        return "<span class='badge badge-{$class}'>{$statusText}</span>";
    }

    // Accessor for category display name
    public function getCategoryNameAttribute(): string
    {
        return self::CATEGORIES[$this->category] ?? ucfirst($this->category);
    }

     // Accessor for displaying attachment link in Admin panel
    public function getAttachmentLinkAttribute(): string
    {
        if ($this->attachment_path) {
            // Ensure the storage is linked (php artisan storage:link)
            $url = Storage::url($this->attachment_path);
            return '<a href="' . $url . '" target="_blank">View Attachment</a>';
        }
        return 'No attachment';
    }

    // --- NEW ACCESSOR for Preview Button ---
    public function getAttachmentPreviewButtonAttribute(): string
    {
        if ($this->attachment_path) {
            // Ensure the storage is linked (php artisan storage:link)
            $url = Storage::url($this->attachment_path);
            $fileName = basename($this->attachment_path); // Get just the filename

            // Determine file type for icon (basic example)
            $iconClass = 'la-file'; // Default icon
            $extension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
            if (in_array($extension, ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'])) {
                $iconClass = 'la-image';
            } elseif ($extension === 'pdf') {
                $iconClass = 'la-file-pdf';
            } elseif (in_array($extension, ['doc', 'docx'])) {
                $iconClass = 'la-file-word';
            }

            // Generate the button HTML
            return '<a href="' . $url . '" target="_blank" class="btn btn-sm btn-outline-secondary" title="Preview: '.$fileName.'">
                      <i class="la ' . $iconClass . '"></i> Preview
                    </a>';
        }
        // Return a placeholder if no attachment
        return '<span class="text-muted">N/A</span>';
    }
    // --- END NEW ACCESSOR ---


    public function deleteUserButton(): string
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
