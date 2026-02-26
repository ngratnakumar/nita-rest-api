<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Gate;
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
| Authenticated Routes (Any logged-in user)
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {

    // Discovery Routes
    Route::get('/services', fn() => response()->json(Service::all())); // List all
    Route::get('/services/{service}', fn(Service $service) => response()->json($service));
    Route::get('/roles', fn() => response()->json(Role::all()));

    // User Profile & My Permissions
    Route::get('/me', [AuthController::class, 'me']);

    /*
    |--------------------------------------------------------------------------
    | Service-Specific Access (Protected by 'service' middleware)
    |--------------------------------------------------------------------------
    */
    Route::get('/vpn/credentials', function() {
        return ["username" => auth()->user()->username, "config" => "VPN_DATA_HERE"];
    })->middleware('service:vpn');

    Route::get('/wiki/token', function() {
        return ["url" => "https://wiki.ncra.tifr.res.in", "token" => "WIKI_ACCESS_TOKEN"];
    })->middleware('service:wiki');

    Route::get('/gitlab/access', function() {
        return ["status" => "active", "server" => "gitlab.ncra.tifr.res.in"];
    })->middleware('service:gitlab');


    /*
    |--------------------------------------------------------------------------
    | Administrative Management (Super Admin Only)
    |--------------------------------------------------------------------------
    */
    Route::middleware('can:manage-system')->group(function () {
        
        // Role & Service Management
        Route::post('/roles', [ManagementController::class, 'storeRole']);
        Route::post('/services', [ManagementController::class, 'storeService']);
        Route::patch('/services/{service}', [ManagementController::class, 'updateService']);
        Route::delete('/services/{service}', [ManagementController::class, 'destroyService']);
        
        // Assignment & Logs
        Route::post('/users/assign-role', [ManagementController::class, 'assignRoleToUser']);
        
        Route::get('/admin/logs', function() {
            return AuditLog::with('user:id,username,name')
                            ->latest()
                            ->paginate(50);
        });
    });
});