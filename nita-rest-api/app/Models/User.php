<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, HasApiTokens, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'username',
        'password',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function roles() {
        return $this->belongsToMany(Role::class);
    }

    // Helper to check if user has access to a service
    public function hasService($serviceName) {
        return $this->roles()->whereHas('services', function($q) use ($serviceName) {
            $q->where('name', $serviceName);
        })->exists();
    }

    public function logAction($action, $details)
    {
        return $this->auditLogs()->create([
            'action' => $action,
            'details' => $details,
        ]);
    }

    public function auditLogs()
    {
        return $this->hasMany(AuditLog::class);
    }

    public function getAuthIdentifierName()
    {
        return 'username';
    }
}
