<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Role;
use App\Models\Service;
use App\Models\User;
use Illuminate\Support\Facades\Gate;

class ManagementController extends Controller
{
    /**
     * Import/Sync an LDAP or FreeIPA user into the local database by username.
     */
    public function syncExternalUser(Request $request) {
        $request->validate(['username' => 'required|string']);
        
        $user = User::where('username', $request->username)->first();

        if (!$user) {
            $user = User::create([
                'username' => $request->username,
                'name'     => $request->username,
                'password' => bcrypt(str_random(16)), 
                'type'     => 1, // 1 for LDAP/IPA
            ]);
            
            auth()->user()->logAction('sync_user', "Imported user: {$request->username}");
        }

        return response()->json($user->load('roles'));
    }

    public function storeService(Request $request) {
        Gate::authorize('manage-system');

        $data = $request->validate([
            'name'     => 'required|unique:services,name',
            'slug'     => 'required|unique:services,slug',
            'url'      => 'required|url',
            'category' => 'nullable|string',
            'icon'     => 'nullable|string'
        ]);
        
        $service = Service::create($data);
        auth()->user()->logAction('create_service', "Service: {$service->name}");

        return response()->json($service, 201);
    }

    public function updateService(Request $request, Service $service) {
        Gate::authorize('manage-system');

        $data = $request->validate([
            'name'     => 'required|unique:services,name,' . $service->id,
            'slug'     => 'required|unique:services,slug,' . $service->id,
            'url'      => 'required|url',
            'category' => 'nullable|string',
            'icon'     => 'nullable|string'
        ]);

        $service->update($data);
        auth()->user()->logAction('update_service', "Service updated: {$service->name}");

        return response()->json($service);
    }

    public function destroyService(Service $service) {
        Gate::authorize('manage-system');
        $name = $service->name;
        $service->delete();
        auth()->user()->logAction('delete_service', "Service deleted: $name");
        return response()->json(['message' => "Deleted successfully."]);
    }

    public function getAllRoles() {
        return response()->json(Role::with('services')->get());
    }

    public function syncRoleServices(Request $request, Role $role) {
        $request->validate(['service_ids' => 'required|array|exists:services,id']);
        $role->services()->sync($request->service_ids);
        return response()->json(['message' => 'Role permissions updated']);
    }

    public function indexUsers() {
        return response()->json(User::with('roles')->get());
    }

    public function syncUserRoles(Request $request, User $user) {
        $request->validate([
            'role_ids'   => 'required|array',
            'role_ids.*' => 'exists:roles,id'
        ]);

        $user->roles()->sync($request->role_ids);
        return response()->json(['message' => 'Roles updated', 'user' => $user->load('roles')]);
    }

    public function destroyRole(Role $role) {
        if ($role->name === 'admin') {
            return response()->json(['error' => 'Cannot delete admin role'], 403);
        }
        $role->delete();
        return response()->json(['message' => 'Role deleted']);
    }
}