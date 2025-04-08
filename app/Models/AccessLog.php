<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Backpack\CRUD\app\Models\Traits\CrudTrait;

class AccessLog extends Model
{
    use HasFactory;
    use CrudTrait;

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'ip_address',
        'user_agent',
        'url',
        'method',
        'referer',
        'is_admin_attempt',
        'is_blocked',
        'request_data',
        'country',
        'city',
        'browser',
        'platform',
        'device',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array
     */
    protected $casts = [
        'is_admin_attempt' => 'boolean',
        'is_blocked' => 'boolean',
        'request_data' => 'array',
    ];

    /**
     * Scope a query to only include admin attempts.
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeAdminAttempts($query)
    {
        return $query->where('is_admin_attempt', true);
    }

    /**
     * Scope a query to only include blocked IPs.
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeBlocked($query)
    {
        return $query->where('is_blocked', true);
    }

    /**
     * Block this IP address.
     *
     * @return bool
     */
    public function block()
    {
        return $this->update(['is_blocked' => true]);
    }

    /**
     * Unblock this IP address.
     *
     * @return bool
     */
    public function unblock()
    {
        return $this->update(['is_blocked' => false]);
    }

    /**
     * Get the block/unblock button HTML.
     *
     * @return string
     */
    public function blockIpButton()
    {
        $route = backpack_url('access-log/'.$this->id.'/block');
        $label = $this->is_blocked ? 'Unblock IP' : 'Block IP';
        $class = $this->is_blocked ? 'btn-success' : 'btn-danger';
        
        return '<a href="javascript:void(0)" 
                  onclick="if(confirm(\'Are you sure you want to ' . strtolower($label) . ' this IP address?\')) { 
                      event.preventDefault(); 
                      document.getElementById(\'block-form-' . $this->id . '\').submit(); 
                  }" 
                  class="btn btn-sm ' . $class . '">
                  <i class="la la-' . ($this->is_blocked ? 'unlock' : 'ban') . '"></i> ' . $label . '
              </a>
              <form id="block-form-' . $this->id . '" action="' . $route . '" method="POST" style="display: none;">
                  ' . csrf_field() . '
              </form>';
    }
}
