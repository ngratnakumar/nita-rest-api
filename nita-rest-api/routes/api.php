<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ManagementController;
use App\Http\Controllers\MediaController;
use App\Http\Controllers\LDAPController;
use App\Http\Controllers\TicketController;
use App\Http\Controllers\NotificationController;
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
| Authenticated Routes (Common for all Staff)
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {

    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/change-password', [AuthController::class, 'changePassword']);

    /**
     * Dashboard Discovery
     * Lists services based on the user's specific roles.
     */
    Route::get('/services', function () {
        $user = auth()->user();
        
        $query = Service::with('roles'); // Eager load for frontend logic

        if (!$user->roles()->where('name', 'admin')->exists()) {
            $query->whereHas('roles', function ($q) use ($user) {
                $q->whereIn('roles.id', $user->roles->pluck('id'));
            });
        }
        
        return $query->get();
    });

    Route::get('/services/{service}', fn(Service $service) => response()->json($service->load('roles')));
    
    // Matrix Helper: Needed by the frontend to build the grid
    Route::get('/roles', [ManagementController::class, 'getAllRoles']);

    // Complaint / Ticketing
    Route::prefix('tickets')->group(function () {
        Route::get('/', [TicketController::class, 'index']);
        Route::get('/handlers', [TicketController::class, 'handlers']);
        Route::get('/approvers', [TicketController::class, 'approvers']);
        Route::post('/', [TicketController::class, 'store']);
        Route::get('/{ticket}', [TicketController::class, 'show']);
        Route::post('/{ticket}/comment', [TicketController::class, 'comment']);
        Route::patch('/{ticket}/status', [TicketController::class, 'updateStatus']);
        Route::patch('/{ticket}/assign', [TicketController::class, 'assign']);
        Route::post('/{ticket}/reopen', [TicketController::class, 'reopen']);
        Route::post('/{ticket}/approvals', [TicketController::class, 'requestApproval']);
        Route::post('/{ticket}/approvals/{approval}/decision', [TicketController::class, 'decideApproval']);
    });

    // Notifications
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllRead']);
    Route::post('/notifications/{notification}/read', [NotificationController::class, 'markRead']);

    /**
     * Service-Specific Credentials/Tokens
     */
    Route::middleware('service:vpn')->get('/vpn/credentials', function () {
        return ["username" => auth()->user()->username, "config" => "VPN_DATA_HERE"];
    });

    Route::middleware('service:wiki')->get('/wiki/token', function () {
        return ["url" => "https://wiki.ncra.tifr.res.in", "token" => "WIKI_ACCESS_TOKEN"];
    });

    /*
    |--------------------------------------------------------------------------
    | Administrative Routes (manage-system only)
    |--------------------------------------------------------------------------
    */
    Route::middleware('can:manage-system')->prefix('admin')->group(function () {
        
        // --- LDAP & User Control ---
        Route::get('/users', [ManagementController::class, 'indexUsers']);
        Route::post('/users/sync', [ManagementController::class, 'syncExternalUser']);
        Route::post('/ldap/discover', [LDAPController::class, 'discover']);
        Route::post('/ldap/sync', [LDAPController::class, 'sync']);
        Route::put('/users/{user}/roles', [ManagementController::class, 'syncUserRoles']);
        
        // --- Role & Matrix Management ---
        Route::post('/roles', [ManagementController::class, 'storeRole']);
        Route::patch('/roles/{role}', [ManagementController::class, 'updateRole']);
        Route::delete('/roles/{role}', [ManagementController::class, 'destroyRole']);
        
        // The Sync Route used by Roles.tsx Matrix
        Route::put('/roles/{role}/services', [ManagementController::class, 'syncRoleServices']);
        
        // --- Service (Tool) Management ---
        Route::get('/services', [ManagementController::class, 'indexServices']);
        Route::post('/services', [ManagementController::class, 'storeService']);
        
        // Match PUT/PATCH to handle Multipart (Images) and JSON updates
        Route::match(['put', 'patch'], '/services/{service}', [ManagementController::class, 'updateService']);
        
        Route::delete('/services/{service}', [ManagementController::class, 'destroyService']);
        
        // Service Maintenance Status
        Route::patch('/services/{service}/maintenance', [ManagementController::class, 'toggleMaintenanceStatus']);
        
        // The Sync Route used by Services.tsx Form
        Route::put('/services/{service}/roles', [ManagementController::class, 'syncServiceRoles']);

        // --- Admin Masquerade ---
        Route::post('/masquerade/{user}', [AuthController::class, 'masquerade']);

        // --- Media & Assets ---
        Route::prefix('media')->group(function () {
            Route::post('/upload', [MediaController::class, 'upload']);
            Route::get('/icons', [MediaController::class, 'listIcons']);
            Route::delete('/icons/{filename}', [MediaController::class, 'destroy']);
        });

        // --- Audit Logs ---
        Route::get('/logs', function () {
            return AuditLog::with('user:id,username,name')->latest()->paginate(50);
        });

        Route::get('/categories', [ManagementController::class, 'indexCategories']);
        Route::post('/categories', [ManagementController::class, 'storeCategory']);
        Route::delete('/categories/{category}', [ManagementController::class, 'destroyCategory']);

    });
});