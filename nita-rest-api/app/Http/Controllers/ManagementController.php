<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Role;
use App\Models\Service;
use App\Models\User;
use Illuminate\Support\Facades\Gate;


class ManagementController extends Controller
{
    // 1. Create a new Service (e.g., 'gitlab', 'ncra cloud')
    public function storeService(Request $request) {
        Gate::authorize('manage-system');

        $data = $request->validate(['name' => 'required|unique:services,name']);
        $service = Service::create($data);

        // LOG THE ACTION
        auth()->user()->logAction('create_service', "Service: {$service->name}");

        return $service;
    }

    // 2. Create a new Role (e.g., 'project_student')
    public function storeRole(Request $request) {
        if (Gate::denies('manage-system')) {
            return response()->json(['message' => 'You are not authorized to create roles.'], 403);
        }
        $data = $request->validate(['name' => 'required|unique:roles,name']);
        return Role::create($data);
    }

    // 3. Map Services to a Role
    public function syncRoleServices(Request $request, Role $role) {
        $request->validate(['service_ids' => 'required|array|exists:services,id']);
        $role->services()->sync($request->service_ids);
        return response()->json(['message' => 'Role updated with new services']);
    }

    // 4. Map a User to a Role (Local DB mapping)
    public function assignRoleToUser(Request $request) {
        Gate::authorize('manage-system');

        $user = User::findOrFail($request->user_id);
        $role = Role::findOrFail($request->role_id);
        
        $user->roles()->syncWithoutDetaching([$role->id]);

        // LOG THE ACTION
        auth()->user()->logAction('assign_role', "User: {$user->username}", ['role' => $role->name]);

        return response()->json(['message' => 'Role assigned']);
    }

    /**
     * Delete a service
     */
    public function destroyService(Service $service)
    {
        Gate::authorize('manage-system');

        $serviceName = $service->name;
        $service->delete();

        // Log the action using the helper we built earlier
        auth()->user()->logAction('delete_service', "Service: $serviceName");

        return response()->json(['message' => "Service '$serviceName' deleted successfully."]);
    }

    /**
     * Update a service name
     */
    public function updateService(Request $request, Service $service)
    {
        Gate::authorize('manage-system');

        $data = $request->validate([
            'name' => 'required|unique:services,name,' . $service->id
        ]);

        $oldName = $service->name;
        $service->update($data);

        auth()->user()->logAction('update_service', "Service: $oldName to {$service->name}");

        return response()->json($service);
    }
    
    public function getAccessMatrix()
    {
        if (Gate::denies('manage-system')) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        // Get all roles with their associated services
        $matrix = Role::with('services:id,name')->get(['id', 'name']);

        return response()->json([
            'total_services' => Service::count(),
            'roles_mapping' => $matrix
        ]);
    }
}