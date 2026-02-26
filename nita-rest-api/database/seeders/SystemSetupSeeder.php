<?php
namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Role;
use App\Models\Service;
use Illuminate\Support\Facades\Hash;

class SystemSetupSeeder extends Seeder
{
    public function run(): void
    {
        // 1. All your requested Roles
        $roles = ['admin', 'it', 'faculty', 'student', 'staff', 'project_student', 'remote', 'visitor'];
        foreach ($roles as $role) {
            Role::firstOrCreate(['name' => $role]);
        }

        // 2. All your requested Services
        $services = [
            'profile_update', 'inventory_check', 'ticketing', 'wiki', 'servers', 
            'vpn', 'storage', 'email', 'ncra_cloud', 'desktop', 'laptop', 
            'requests', 'gitlab', 'monitoring', 'DNS', 'DHCP', 'Firewalls', 
            'electrical', 'mechanical', 'purchase', 'accounts', 'tifr', 
            'security', 'medical', 'general_admin', 'guesthouse', 'hostel', 
            'meetings', 'accessories'
        ];

        foreach ($services as $service) {
            Service::firstOrCreate(['name' => $service]);
        }

        // 3. Ensure your Admin User exists with the correct password
        User::create([
            'username' => 'admin',
            'name' => 'Administrator',
            'password' => Hash::make('ncra.123'), // MUST use Hash::make
            'role' => 'admin',
        ]);

        // 4. Attach Admin Role to Admin User
        $adminRole = Role::where('name', 'admin')->first();
        $admin->roles()->syncWithoutDetaching([$adminRole->id]);
    }
}