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
Route::post('/admin/users/sync', [ManagementController::class, 'syncExternalUser']);

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
    Route::get('/roles', fn() => response()->json(Role::all()));
    Route::get('/me', [AuthController::class, 'me']);

    /**
     * Service-Specific Logic
     * Access is restricted by the 'service' middleware
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
        
        // User & Role Management
        Route::post('/users/sync', [ManagementController::class, 'syncExternalUser']);
        Route::get('/users', [ManagementController::class, 'indexUsers']);
        Route::put('/users/{user}/roles', [ManagementController::class, 'syncUserRoles']);
        Route::post('/users/assign-role', [ManagementController::class, 'assignRoleToUser']);
        Route::post('/roles', [ManagementController::class, 'storeRole']);
        
        // Service Management
        Route::post('/services', [ManagementController::class, 'storeService']);
        Route::patch('/services/{service}', [ManagementController::class, 'updateService']);
        Route::delete('/services/{service}', [ManagementController::class, 'destroyService']);
        
        // Access Matrix & Logs
        Route::get('/matrix', [ManagementController::class, 'getAccessMatrix']);
        Route::get('/logs', function () {
            return AuditLog::with('user:id,username,name')
                            ->latest()
                            ->paginate(50);
        });
    });
});