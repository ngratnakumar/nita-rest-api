<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Role;
use App\Models\Service;
use Illuminate\Support\Facades\Hash;

class NitaSystemSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Create Roles
        $adminRole = Role::create(['name' => 'admin']);
        $userRole = Role::create(['name' => 'user']);

        // 2. Create local Admin User
        $admin = User::create([
            'name' => 'System Administrator',
            'username' => 'admin',
            'password' => Hash::make('ncra.123'),
        ]);

        // Attach admin role
        $admin->roles()->attach($adminRole);

        // 3. Create Sample Services
        $services = [
            [
                'name' => 'Internal Wiki',
                'slug' => 'wiki',
                'category' => 'Documentation',
                'url' => 'https://wiki.ncra.tifr.res.in',
                'icon' => 'BookOpen'
            ],
            [
                'name' => 'NCRA GitLab',
                'slug' => 'gitlab',
                'category' => 'Development',
                'url' => 'https://git.ncra.tifr.res.in',
                'icon' => 'Github'
            ],
            [
                'name' => 'NMS Monitor',
                'slug' => 'nms',
                'category' => 'Network',
                'url' => 'https://nms.ncra.tifr.res.in',
                'icon' => 'Activity'
            ],
        ];

        foreach ($services as $s) {
            $service = Service::create($s);
            // Link all services to the admin role
            $adminRole->services()->attach($service);
        }
    }
}