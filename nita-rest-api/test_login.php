<?php
require 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Http\Kernel')->handle(
    $request = Illuminate\Http\Request::capture()
);

// Test the login logic
use App\Models\User;
use Illuminate\Support\Facades\Hash;

echo "=== TESTING ADMIN LOGIN ===\n\n";

// Find admin user
$admin = User::where('username', 'admin')->with('roles')->first();

if (!$admin) {
    echo "❌ ADMIN USER NOT FOUND\n";
    exit;
}

echo "✓ Admin user found\n";
echo "  - Username: {$admin->username}\n";
echo "  - Type: {$admin->type}\n";
echo "  - Email: {$admin->email}\n";

// Test password
$passwordCorrect = Hash::check('password123', $admin->password);
echo ($passwordCorrect ? "✓" : "❌") . " Password 'password123' is " . ($passwordCorrect ? "CORRECT" : "WRONG") . "\n";

// Test roles
$adminRole = $admin->roles()->where('name', 'admin')->exists();
echo ($adminRole ? "✓" : "❌") . " Has admin role: " . ($adminRole ? "YES" : "NO") . "\n";

// Show all roles
echo "  - Roles: ";
$admin->roles->each(function($r) { echo $r->name . " "; });
echo "\n\n";

// Find ratnakumar and check admin role
$ratnakumar = User::where('username', 'ratnakumar')->with('roles')->first();

if ($ratnakumar) {
    echo "=== CHECKING RATNAKUMAR ===\n\n";
    echo "✓ Ratnakumar user found\n";
    echo "  - Username: {$ratnakumar->username}\n";
    echo "  - Type: {$ratnakumar->type}\n";
    $ratAdminRole = $ratnakumar->roles()->where('name', 'admin')->exists();
    echo ($ratAdminRole ? "✓" : "❌") . " Has admin role: " . ($ratAdminRole ? "YES" : "NO") . "\n";
    echo "  - Roles: ";
    $ratnakumar->roles->each(function($r) { echo $r->name . " "; });
    echo "\n";
} else {
    echo "❌ Ratnakumar user NOT FOUND\n";
}
