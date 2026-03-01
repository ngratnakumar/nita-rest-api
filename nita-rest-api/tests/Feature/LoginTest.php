<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use App\Models\Role;
use Illuminate\Support\Facades\Hash;

class LoginTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Create roles
        $adminRole = Role::create(['name' => 'admin']);
        $staffRole = Role::create(['name' => 'staff']);

        // Create local admin user
        $this->adminUser = User::create([
            'username' => 'admin',
            'name' => 'System Admin',
            'email' => 'admin@example.com',
            'password' => Hash::make('password123'),
            'type' => 0 // Local
        ]);
        $this->adminUser->roles()->attach($adminRole->id);

        // Create FreeIPA user with admin role
        $this->ratnakumar = User::create([
            'username' => 'ratnakumar',
            'name' => 'Ratna Kumar',
            'email' => 'ratna@example.com',
            'password' => Hash::make(rand()), // Random password for LDAP user
            'type' => 2 // FreeIPA
        ]);
        $this->ratnakumar->roles()->attach($adminRole->id);

        // Create regular staff user
        $this->staffUser = User::create([
            'username' => 'staff',
            'name' => 'Staff Member',
            'email' => 'staff@example.com',
            'password' => Hash::make('password123'),
            'type' => 0 // Local
        ]);
        $this->staffUser->roles()->attach($staffRole->id);
    }

    public function test_local_admin_login()
    {
        $response = $this->postJson('/api/login', [
            'username' => 'admin',
            'password' => 'password123',
            'type' => '0'
        ]);

        $response->assertStatus(200);
        $response->assertJson([
            'status' => 'success'
        ]);
        $response->assertJsonStructure(['token', 'user' => ['id', 'username', 'roles']]);

        // Verify token is set
        $this->assertNotEmpty($response['token']);

        // Verify user has admin role
        $this->assertCount(1, $response['user']['roles']);
        $this->assertEquals('admin', $response['user']['roles'][0]['name']);
    }

    public function test_local_admin_login_wrong_password()
    {
        $response = $this->postJson('/api/login', [
            'username' => 'admin',
            'password' => 'wrongpassword',
            'type' => '0'
        ]);

        $response->assertStatus(401);
        $response->assertJson([
            'status' => 'error',
            'message' => 'Invalid local credentials'
        ]);
    }

    public function test_staff_user_login()
    {
        $response = $this->postJson('/api/login', [
            'username' => 'staff',
            'password' => 'password123',
            'type' => '0'
        ]);

        $response->assertStatus(200);
        $response->assertJson(['status' => 'success']);
        $response->assertJsonStructure(['token', 'user' => ['id', 'username', 'roles']]);

        // Verify user has staff role, NOT admin
        $this->assertCount(1, $response['user']['roles']);
        $this->assertEquals('staff', $response['user']['roles'][0]['name']);
    }

    public function test_ratnakumar_freeipa_user_has_admin_role()
    {
        // Test that ratnakumar user in database has admin role
        $user = User::where('username', 'ratnakumar')->first();
        $this->assertNotNull($user);
        $this->assertTrue($user->roles()->where('name', 'admin')->exists());
    }

    public function test_me_endpoint_shows_admin_capability()
    {
        // Login as admin
        $response = $this->postJson('/api/login', [
            'username' => 'admin',
            'password' => 'password123',
            'type' => '0'
        ]);

        $token = $response['token'];

        // Call me endpoint
        $meResponse = $this->withHeader('Authorization', "Bearer $token")
            ->getJson('/api/me');

        $meResponse->assertStatus(200);
        $meResponse->assertJson([
            'capabilities' => [
                'admin' => true
            ]
        ]);
    }

    public function test_me_endpoint_shows_non_admin_capability()
    {
        // Login as staff
        $response = $this->postJson('/api/login', [
            'username' => 'staff',
            'password' => 'password123',
            'type' => '0'
        ]);

        $token = $response['token'];

        // Call me endpoint
        $meResponse = $this->withHeader('Authorization', "Bearer $token")
            ->getJson('/api/me');

        $meResponse->assertStatus(200);
        $meResponse->assertJson([
            'capabilities' => [
                'admin' => false
            ]
        ]);
    }
}
