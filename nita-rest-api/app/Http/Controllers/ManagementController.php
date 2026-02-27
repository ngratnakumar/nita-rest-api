<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Role;
use App\Models\Service;
use App\Models\User;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str; // Added missing import
use LdapRecord\Container;

class ManagementController extends Controller
{
    /**
     * Import/Sync an LDAP or FreeIPA user into local SQLite.
     */
    public function syncExternalUser(Request $request) 
    {
        $request->validate([
            'username' => 'required|string',
            'type' => 'required|in:1,2', // 1: OpenLDAP, 2: FreeIPA
        ]);

        $connectionName = ($request->type == '1') ? 'openldap' : 'freeipa';
        
        try {
            // Search the external directory
            $ldapUser = \LdapRecord\Container::getConnection($connectionName)
                ->query()
                ->where('uid', '=', $request->username)
                ->first();

            if (!$ldapUser) {
                return response()->json(['message' => 'User not found in LDAP'], 404);
            }

            // Create or Update the "Shadow User"
            $user = User::updateOrCreate(
                ['username' => $request->username],
                [
                    'name' => $ldapUser->getAttribute('cn')[0] ?? $request->username,
                    'email' => $ldapUser->getAttribute('mail')[0] ?? null,
                    'type' => $request->type,
                    'password' => bcrypt(Str::random(16)),
                ]
            );

            return response()->json($user->load('roles'));

        } catch (\Exception $e) {
            return response()->json(['message' => 'LDAP Error: ' . $e->getMessage()], 500);
        }
    }

    public function syncRoleServices(Request $request, Role $role)
    {
        $request->validate(['services' => 'present|array']);
        $role->services()->sync($request->services);
        return response()->json(['message' => 'Role permissions updated', 'role' => $role->load('services')]);
    }

    public function syncUserRoles(Request $request, User $user)
    {
        $request->validate(['roles' => 'present|array']);
        $user->roles()->sync($request->roles);
        return response()->json(['message' => 'User roles updated successfully']);
    }

    // --- Service CRUD ---
    public function storeService(Request $request)
    {
        // 1. Validate
        $data = $request->validate([
            'name' => 'required|string',
            'slug' => 'required|string|unique:services,slug',
            'url'  => 'required|url',
            'category' => 'nullable|string',
            'icon' => 'nullable|string',
        ]);

        // 2. Create using the validated $data array
        $service = Service::create($data); 

        return response()->json($service, 201);
    }

    public function updateService(Request $request, Service $service) {
        Gate::authorize('manage-system');
        $data = $request->validate([
            'name' => 'required|unique:services,name,' . $service->id,
            'slug' => 'required|unique:services,slug,' . $service->id,
            'url' => 'required|url',
            'category' => 'nullable|string',
            'icon' => 'nullable|string'
        ]);
        $service->update($data);
        return response()->json($service);
    }

    public function destroyService(Service $service) {
        Gate::authorize('manage-system');
        $service->delete();
        return response()->json(['message' => "Deleted successfully."]);
    }

    // --- Role Management ---
    public function getAllRoles() {
        return response()->json(Role::with('services')->get());
    }

    public function storeRole(Request $request)
    {
        Gate::authorize('manage-system');

        $data = $request->validate([
            'name' => 'required|string|unique:roles,name|max:50',
        ]);

        // Force lowercase for consistency (e.g., "Admin" -> "admin")
        $data['name'] = strtolower($data['name']);

        $role = Role::create($data);

        return response()->json($role);
    }

    public function updateRole(Request $request, Role $role)
    {
        Gate::authorize('manage-system');

        // Protect the core 'admin' role from being renamed easily
        if ($role->name === 'admin') {
            return response()->json(['message' => 'The core admin role cannot be renamed.'], 403);
        }

        $data = $request->validate([
            'name' => 'required|string|unique:roles,name,' . $role->id,
        ]);

        $data['name'] = strtolower($data['name']);
        $role->update($data);

        return response()->json($role);
    }

    public function indexUsers() {
        return response()->json(User::with('roles')->get());
    }

    public function syncServiceRoles(Request $request, Service $service)
    {
        Gate::authorize('manage-system');
        
        $request->validate([
            'roles' => 'array',
            'roles.*' => 'exists:roles,id'
        ]);

        // This updates the relationship in the pivot table
        $service->roles()->sync($request->roles);

        return response()->json(['message' => 'Role mapping updated']);
    }


}