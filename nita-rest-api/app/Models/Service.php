<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Service extends Model
{
    protected $fillable = ['name', 'slug', 'url', 'description', 'icon', 'image_path', 'category', 'is_maintenance', 'maintenance_message'];

    // Add an accessor to ensure the full URL is returned for the image
    public function getImagePathAttribute($value)
    {
        return $value ? asset('storage/' . $value) : null;
    }

    public function roles()
    {
        return $this->belongsToMany(Role::class);
    }
}
