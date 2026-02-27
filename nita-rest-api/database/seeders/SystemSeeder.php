<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Role;
use App\Models\Service;
use Illuminate\Support\Facades\Hash;

class SystemSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Create Core Roles
        $adminRole = Role::firstOrCreate(['name' => 'admin']);
        $staffRole = Role::firstOrCreate(['name' => 'staff']);
        $guestRole = Role::firstOrCreate(['name' => 'guest']);

        // 2. Create Default Services (NCRA Specific Examples)
        $services = [
            [
                'name' => 'GitLab Internal',
                'slug' => 'gitlab',
                'url' => 'https://gitlab.ncra.tifr.res.in',
                'category' => 'Development',
                'icon' => 'code'
            ],
            [
                'name' => 'NCRA Wiki',
                'slug' => 'wiki',
                'url' => 'https://wiki.ncra.tifr.res.in',
                'category' => 'Documentation',
                'icon' => 'book'
            ],
            [
                'name' => 'VPN Access',
                'slug' => 'vpn',
                'url' => 'https://vpn.ncra.tifr.res.in',
                'category' => 'Infrastructure',
                'icon' => 'shield'
            ],
        ];

        foreach ($services as $s) {
            $service = Service::firstOrCreate(['slug' => $s['slug']], $s);
            
            // Auto-assign all services to the Admin Role
            $adminRole->services()->syncWithoutDetaching([$service->id]);
        }

        // 3. Create the Local SuperAdmin (Shadow User)
        // Change 'ratnakumar' to your actual LDAP username if testing hybrid login
        $adminUser = User::firstOrCreate(
            ['username' => 'admin'], 
            [
                'name' => 'System Administrator',
                'email' => 'admin@ncra.tifr.res.in',
                'password' => Hash::make('password123'), // ONLY for local login testing
                'type' => 0, // 0: Local
            ]
        );

        // Attach Admin Role to the User
        $adminUser->roles()->syncWithoutDetaching([$adminRole->id]);

        $this->command->info('NITA System Seeded Successfully!');
        $this->command->info('Login with: admin / password123');
    }
}