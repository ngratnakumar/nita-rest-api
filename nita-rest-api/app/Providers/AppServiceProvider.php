<?php

namespace App\Providers;

use App\Models\User;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        // 1. The Global Interceptor (Super Admin Bypass)
        Gate::before(function (User $user, $ability) {
            if ($user->roles()->where('name', 'admin')->exists()) {
                return true; // Admins can do everything
            }
        });

        // 2. Your existing Service Gate
        Gate::define('access-service', function (User $user, $serviceName) {
            return $user->hasService($serviceName);
        });

        // 3. System Management Gate
        Gate::define('manage-system', function (User $user) {
            // This is technically redundant now because of Gate::before, 
            // but it's good for explicit code readability
            return $user->roles()->where('name', 'admin')->exists();
        });
    }
}