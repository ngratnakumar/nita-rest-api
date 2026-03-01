<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use LdapRecord\Container;
use Exception;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class LDAPController extends Controller
{
    /**
     * Discover a user from OpenLDAP or FreeIPA
     * Searches both directories and returns user details if found
     */
    public function discover(Request $request)
    {
        $request->validate([
            'username' => 'required|string|min:2',
        ]);

        $username = trim($request->input('username'));
        
        try {
            // Try OpenLDAP first
            Log::info("Searching for user: {$username} in OpenLDAP");
            $user = $this->searchLdapDirectory('openldap', $username);
            if ($user) {
                Log::info("User {$username} found in OpenLDAP");
                return response()->json(array_merge($user, ['provider' => 'OpenLDAP']));
            }

            // Try FreeIPA next
            Log::info("Searching for user: {$username} in FreeIPA");
            $user = $this->searchLdapDirectory('freeipa', $username);
            if ($user) {
                Log::info("User {$username} found in FreeIPA");
                return response()->json(array_merge($user, ['provider' => 'FreeIPA']));
            }

            Log::warning("User {$username} not found in any directory");
            return response()->json([
                'message' => "User '{$username}' not found in OpenLDAP or FreeIPA. Please check the username.",
                'username' => $username
            ], 404);

        } catch (Exception $e) {
            Log::error('LDAP Discovery error: ' . $e->getMessage(), ['exception' => $e]);
            return response()->json([
                'message' => 'LDAP/FreeIPA directory connection failed. Please try again later.',
                'debug' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Search a specific LDAP directory for a user
     */
    private function searchLdapDirectory($connectionName, $username)
    {
        try {
            $connection = Container::getConnection($connectionName);
            
            // Query for the user with uid attribute
            $ldapUser = $connection->query()
                ->where('uid', '=', $username)
                ->first();

            if (!$ldapUser) {
                Log::debug("User not found in {$connectionName} with uid={$username}");
                return null;
            }

            // Extract user information from LDAP
            $userData = [
                'username' => $ldapUser->getFirstAttribute('uid') ?? $username,
                'name' => $ldapUser->getFirstAttribute('cn') ?? $ldapUser->getFirstAttribute('displayname') ?? $username,
                'email' => $ldapUser->getFirstAttribute('mail') ?? $ldapUser->getFirstAttribute('mailalternateaddress') ?? "{$username}@ncra.tifr.res.in",
            ];

            Log::debug("User data extracted from {$connectionName}", $userData);
            return $userData;

        } catch (Exception $e) {
            Log::error("Error searching {$connectionName}: " . $e->getMessage(), ['exception' => $e]);
            return null;
        }
    }

    /**
     * Sync a discovered LDAP user to local database
     * Creates or updates the user in the local system
     */
    public function sync(Request $request)
    {
        $validated = $request->validate([
            'username' => 'required|string|min:2',
            'email' => 'nullable|email',
            'name' => 'required|string',
            'provider' => 'required|string|in:OpenLDAP,FreeIPA',
        ]);

        try {
            // Determine user type based on provider
            $type = ($validated['provider'] === 'OpenLDAP') ? 1 : 2;

            // Create or update user in local database
            $user = User::updateOrCreate(
                ['username' => $validated['username']],
                [
                    'name' => $validated['name'],
                    'email' => $validated['email'] ?? "{$validated['username']}@ncra.tifr.res.in",
                    'type' => $type,
                    'password' => Hash::make(Str::random(32)), // Random password since LDAP handles auth
                ]
            );

            Log::info("User {$validated['username']} synced successfully from {$validated['provider']}", [
                'user_id' => $user->id,
                'type' => $type
            ]);

            return response()->json([
                'message' => "User '{$user->name}' has been synced successfully. You can now assign roles and services.",
                'user' => $user,
                'success' => true
            ]);

        } catch (Exception $e) {
            Log::error('User sync error: ' . $e->getMessage(), ['exception' => $e]);
            return response()->json([
                'message' => 'Failed to sync user. Please try again.',
                'debug' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }
}
