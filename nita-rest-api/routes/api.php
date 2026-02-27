<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ManagementController;
use App\Models\Role;
use App\Models\Service;
use App\Models\AuditLog;

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/
Route::post('/login', [AuthController::class, 'login'])->name('login');

/*
|--------------------------------------------------------------------------
| Authenticated Routes (Protecting all internal logic)
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {

    /**
     * Discovery & Dashboard
     * Returns services based on the user's roles
     */
    Route::get('/services', function () {
        $user = auth()->user();

        // Admin: Show all services
        if ($user->roles()->where('name', 'admin')->exists()) {
            return Service::all();
        }

        // Standard User: Show only services assigned to their roles
        return Service::whereHas('roles', function ($query) use ($user) {
            $query->whereIn('roles.id', $user->roles->pluck('id'));
        })->get();
    });

    Route::get('/services/{service}', fn(Service $service) => response()->json($service));
    
    // Updated: Load services with roles for the Access Matrix to work
    Route::get('/roles', function() {
        return Role::with('services')->get();
    });

    Route::get('/me', [AuthController::class, 'me']);

    /**
     * Service-Specific Logic (Protected by 'service' middleware)
     */
    Route::middleware('service:vpn')->get('/vpn/credentials', function () {
        return ["username" => auth()->user()->username, "config" => "VPN_DATA_HERE"];
    });

    Route::middleware('service:wiki')->get('/wiki/token', function () {
        return ["url" => "https://wiki.ncra.tifr.res.in", "token" => "WIKI_ACCESS_TOKEN"];
    });

    Route::middleware('service:gitlab')->get('/gitlab/access', function () {
        return ["status" => "active", "server" => "gitlab.ncra.tifr.res.in"];
    });

    /**
     * Administrative Management (Super Admin Only)
     * Protected by the 'manage-system' Gate
     */
    Route::middleware('can:manage-system')->prefix('admin')->group(function () {
        
        // User Sync & Management
        Route::get('/users', [ManagementController::class, 'indexUsers']);
        Route::post('/users/sync', [ManagementController::class, 'syncExternalUser']);
        Route::put('/users/{user}/roles', [ManagementController::class, 'syncUserRoles']);
        
        // Role & Matrix Management
        Route::post('/roles', [ManagementController::class, 'storeRole']);
        // This is the route the Access Matrix (Roles.tsx) uses:
        Route::put('/roles/{role}/services', [ManagementController::class, 'syncRoleServices']);
        Route::delete('/roles/{role}', [ManagementController::class, 'destroyRole']);
        
        // Service Management
        Route::post('/services', [ManagementController::class, 'storeService']);
        Route::patch('/services/{service}', [ManagementController::class, 'updateService']);
        Route::delete('/services/{service}', [ManagementController::class, 'destroyService']);
        
        // Audit Logs
        Route::get('/logs', function () {
            return AuditLog::with('user:id,username,name')
                            ->latest()
                            ->paginate(50);
        });
    });
});