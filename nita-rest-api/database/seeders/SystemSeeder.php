<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Role;
use App\Models\Service;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

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

        // 4. Create ratnakumar as LDAP admin (if synced from LDAP, will have admin access)
        $ratnakumarUser = User::firstOrCreate(
            ['username' => 'ratnakumar'],
            [
                'name' => 'Naga Ratna Kumar Bollapragada',
                'email' => 'ratnakumar@ncra.tifr.res.in',
                'password' => Hash::make(\Illuminate\Support\Str::random(32)), // Random since auth via LDAP
                'type' => 1, // Can be 1 (OpenLDAP) or 2 (FreeIPA) - doesn't matter, just a placeholder
            ]
        );

        // Attach Admin Role to ratnakumar
        $ratnakumarUser->roles()->syncWithoutDetaching([$adminRole->id]);

        $this->command->info('NITA System Seeded Successfully!');
        $this->command->info('✓ Admin User: admin / password123');
        $this->command->info('✓ Ratnakumar: Will authenticate via LDAP/FreeIPA (has Admin role)');
    }
}