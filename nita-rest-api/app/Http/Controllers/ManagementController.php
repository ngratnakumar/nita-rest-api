<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Role;
use App\Models\Service;
use App\Models\User;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use LdapRecord\Container;
use App\Models\Category;

class ManagementController extends Controller
{
    /**
     * --- LDAP / User Sync ---
     */
    public function syncExternalUser(Request $request) 
    {
        $request->validate([
            'username' => 'required|string',
            'type' => 'required|in:1,2' // 1: OpenLDAP, 2: FreeIPA
        ]);

        $connection = ($request->type == '1') ? 'openldap' : 'freeipa';

        try {
            $connectionInstance = Container::getConnection($connection);

            $ldapUser = $connectionInstance->query()
                ->where('uid', '=', $request->username)
                ->first();

            if (!$ldapUser) {
                return response()->json(['message' => "User {$request->username} not found in {$connection}"], 404);
            }

            $name = $ldapUser->getFirstAttribute('cn') ?? $request->username;
            $email = $ldapUser->getFirstAttribute('mail') ?? "{$request->username}@ncra.tifr.res.in";

            $user = User::updateOrCreate(
                ['username' => $request->username],
                [
                    'name' => $name,
                    'email' => $email,
                    'type' => (int)$request->type,
                    'password' => Hash::make(Str::random(16)),
                ]
            );

            return response()->json($user->load('roles'));

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'LDAP Sync Failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * --- User Management ---
     */
    public function indexUsers() 
    {
        return response()->json(User::with('roles')->get());
    }

    public function syncUserRoles(Request $request, User $user)
    {
        Gate::authorize('manage-system');
        $request->validate(['roles' => 'present|array']);
        
        $user->roles()->sync($request->roles);
        return response()->json(['message' => 'User roles updated successfully', 'user' => $user->load('roles')]);
    }

    /**
     * --- Service (Tool) Registry CRUD ---
     */
    public function indexServices()
    {
        // Vital for the Access Matrix: Eager load roles
        return response()->json(Service::with('roles')->get());
    }

    public function storeService(Request $request)
    {
        Gate::authorize('manage-system');

        $data = $request->validate([
            'name' => 'required|string',
            'slug' => 'required|string|unique:services,slug',
            'url'  => 'required|url',
            'category' => 'nullable|string',
            'icon' => 'nullable|string',
            'image' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
            'roles' => 'array'
        ]);

        if ($request->hasFile('image')) {
            $data['image_path'] = $request->file('image')->store('services', 'public');
        }

        $service = Service::create($data); 

        // Sync roles if provided
        if ($request->has('roles')) {
            $service->roles()->sync($request->roles);
        }

        return response()->json($service->load('roles'), 201);
    }

    public function updateService(Request $request, $id)
    {
        Gate::authorize('manage-system');
        $service = Service::findOrFail($id);

        $request->validate([
            'name'     => 'required|string',
            'slug'     => 'required|string|unique:services,slug,' . $id,
            'url'      => 'required|url',
            'category' => 'required|string',
            'icon'     => 'nullable|string',
            'image'    => 'nullable|image|mimes:jpg,jpeg,png|max:2048',
            'roles'    => 'array' 
        ]);

        // Handle Image Upload
        if ($request->hasFile('image')) {
            if ($service->image_path) {
                Storage::disk('public')->delete($service->image_path);
            }
            $service->image_path = $request->file('image')->store('services', 'public');
        }

        // Update basic fields
        $service->update($request->only(['name', 'slug', 'url', 'category', 'icon']));

        // Sync Roles (Keeps the Access Matrix synced)
        if ($request->has('roles')) {
            $service->roles()->sync($request->roles);
        }

        return response()->json($service->load('roles'));
    }

    public function destroyService(Service $service) 
    {
        Gate::authorize('manage-system');
        
        if ($service->image_path) {
            Storage::disk('public')->delete($service->image_path);
        }
        
        $service->delete();
        return response()->json(['message' => "Service deleted successfully."]);
    }

    /**
     * --- Role Management ---
     */
    public function getAllRoles() 
    {
        // Eager load services for the matrix view
        return response()->json(Role::with('services')->get());
    }

    public function storeRole(Request $request)
    {
        Gate::authorize('manage-system');

        $data = $request->validate([
            'name' => 'required|string|unique:roles,name|max:50',
        ]);

        $data['name'] = strtolower($data['name']);
        $role = Role::create($data);

        return response()->json($role, 201);
    }

    public function updateRole(Request $request, Role $role)
    {
        Gate::authorize('manage-system');

        if ($role->name === 'admin') {
            return response()->json(['message' => 'The core admin role cannot be modified.'], 403);
        }

        $data = $request->validate([
            'name' => 'required|string|unique:roles,name,' . $role->id,
        ]);

        $data['name'] = strtolower($data['name']);
        $role->update($data);

        return response()->json($role);
    }

    /**
     * This method handles the logic specifically for the Matrix toggle
     */
    public function syncRoleServices(Request $request, $roleId)
    {
        Gate::authorize('manage-system');

        $request->validate([
            'service_ids' => 'array',
            'service_ids.*' => 'exists:services,id'
        ]);

        $role = Role::findOrFail($roleId);
        $role->services()->sync($request->service_ids ?? []);

        return response()->json([
            'message' => 'Permissions updated',
            'role' => $role->load('services')
        ]);
    }


    // --- Category CRUD ---
    public function indexCategories() {
        return response()->json(Category::orderBy('name')->get());
    }

    public function storeCategory(Request $request) {
        Gate::authorize('manage-system');
        $data = $request->validate(['name' => 'required|string|unique:categories,name|max:30']);
        return response()->json(Category::create($data), 201);
    }

    public function destroyCategory(Category $category) {
        Gate::authorize('manage-system');
        // Security check: Don't delete if services are using this category name
        if (\App\Models\Service::where('category', $category->name)->exists()) {
            return response()->json(['message' => 'Cannot delete. Services are currently assigned to this category.'], 422);
        }
        $category->delete();
        return response()->json(['message' => 'Category deleted.']);
    }


}