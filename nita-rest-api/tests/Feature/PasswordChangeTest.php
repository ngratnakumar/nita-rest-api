<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class PasswordChangeTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Create a test user
        $this->user = User::create([
            'username' => 'testuser',
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => Hash::make('oldpassword123'),
            'type' => 0 // Local user
        ]);
    }

    public function test_change_password_requires_authentication()
    {
        $response = $this->postJson('/api/change-password', [
            'current_password' => 'oldpassword123',
            'new_password' => 'newpassword123',
            'new_password_confirmation' => 'newpassword123'
        ]);

        $response->assertStatus(401);
    }

    public function test_change_password_with_correct_current_password()
    {
        $response = $this->actingAs($this->user)->postJson('/api/change-password', [
            'current_password' => 'oldpassword123',
            'new_password' => 'newpassword123',
            'new_password_confirmation' => 'newpassword123'
        ]);

        $response->assertStatus(200);
        $response->assertJson(['status' => 'success', 'message' => 'Password changed successfully.']);

        // Verify password was actually changed
        $this->user->refresh();
        $this->assertTrue(Hash::check('newpassword123', $this->user->password));
    }

    public function test_change_password_with_incorrect_current_password()
    {
        $response = $this->actingAs($this->user)->postJson('/api/change-password', [
            'current_password' => 'wrongpassword',
            'new_password' => 'newpassword123',
            'new_password_confirmation' => 'newpassword123'
        ]);

        $response->assertStatus(401);
        $response->assertJson(['status' => 'error', 'message' => 'Current password is incorrect.']);
    }

    public function test_change_password_with_mismatched_confirmation()
    {
        $response = $this->actingAs($this->user)->postJson('/api/change-password', [
            'current_password' => 'oldpassword123',
            'new_password' => 'newpassword123',
            'new_password_confirmation' => 'differentpassword'
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['new_password']);
    }

    public function test_change_password_with_short_password()
    {
        $response = $this->actingAs($this->user)->postJson('/api/change-password', [
            'current_password' => 'oldpassword123',
            'new_password' => 'short',
            'new_password_confirmation' => 'short'
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['new_password']);
    }
}
