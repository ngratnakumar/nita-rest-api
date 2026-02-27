<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Role;
use App\Models\Service;
use App\Models\User;
use Illuminate\Support\Facades\Gate;


class ManagementController extends Controller
{

    public function syncExternalUser(Request $request) {
        $request->validate(['username' => 'required|string']);
        $username = $request->username;

        $user = \App\Models\User::where('username', $request->username)->first();

        if (!$user) {
            // Here you could optionally verify against LDAP, 
            // but for management, we create the 'Shadow User' record
            $user = \App\Models\User::create([
                'username' => $request->username,
                'name' => $request->username, // Admin can edit this later
                'password' => bcrypt(str_random(16)), // Randomized for security
                'type' => 1, // Marking as LDAP/IPA type
            ]);
            
            auth()->user()->logAction('sync_user', "Imported user: {$request->username}");
        }

        return response()->json($user->load('roles'));
    }

    // 1. Create a new Service (e.g., 'gitlab', 'ncra cloud')
    // Update the storeService to include all fields from your schema
    public function storeService(Request $request) {
        Gate::authorize('manage-system');

        $data = $request->validate([
            'name' => 'required|unique:services,name',
            'slug' => 'required|unique:services,slug',
            'url'  => 'required|url',
            'category' => 'nullable|string',
            'icon' => 'nullable|string'
        ]);
        
        $service = Service::create($data);
        auth()->user()->logAction('create_service', "Service: {$service->name}");

        return response()->json($service, 201);
    }

    // Add this to help the frontend Role Management UI
    public function getAllRoles() {
        return response()->json(Role::all());
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

    public function indexUsers()
    {
        return response()->json(User::with('roles')->get());
    }

    // Assign multiple roles to a user (Replacement for assignRoleToUser)
    public function syncUserRoles(Request $request, User $user)
    {
        $request->validate([
            'role_ids' => 'required|array',
            'role_ids.*' => 'exists:roles,id'
        ]);

        $user->roles()->sync($request->role_ids);
        
        return response()->json(['message' => 'Roles updated successfully', 'user' => $user->load('roles')]);
    }
}