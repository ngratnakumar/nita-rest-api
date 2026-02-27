<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Service extends Model
{
    protected $fillable = ['name', 'slug', 'url', 'category', 'icon'];

    public function roles()
    {
        return $this->belongsToMany(Role::class);
    }
}
