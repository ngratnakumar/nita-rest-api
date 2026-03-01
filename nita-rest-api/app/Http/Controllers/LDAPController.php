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
        
        // Validate username format
        if (!preg_match('/^[a-zA-Z0-9._\-]+$/', $username)) {
            return response()->json([
                'message' => "Invalid username format. Use only letters, numbers, dots, hyphens, and underscores.",
                'username' => $username
            ], 400);
        }
        
        try {
            // Try OpenLDAP first
            Log::info("=== LDAP SEARCH START === Searching for user: {$username} in OpenLDAP");
            $user = $this->searchLdapDirectory('openldap', $username);
            if ($user) {
                Log::info("✓ User {$username} found in OpenLDAP");
                return response()->json(array_merge($user, ['provider' => 'OpenLDAP']));
            }
            Log::info("✗ User {$username} not found in OpenLDAP, trying FreeIPA");

            // Try FreeIPA next
            Log::info("Searching for user: {$username} in FreeIPA");
            $user = $this->searchLdapDirectory('freeipa', $username);
            if ($user) {
                Log::info("✓ User {$username} found in FreeIPA");
                return response()->json(array_merge($user, ['provider' => 'FreeIPA']));
            }

            Log::warning("✗ User {$username} not found in any directory");
            return response()->json([
                'message' => "User '{$username}' not found in OpenLDAP or FreeIPA. Please check the username.",
                'username' => $username
            ], 404);

        } catch (Exception $e) {
            Log::error('LDAP Discovery error: ' . $e->getMessage(), ['exception' => $e->getTraceAsString()]);
            return response()->json([
                'message' => 'LDAP/FreeIPA directory connection failed. Please try again later.',
                'debug' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Search a specific LDAP directory for a user
     * Handles both object and array responses from LDAP queries
     */
    private function searchLdapDirectory($connectionName, $username)
    {
        try {
            Log::info("Connecting to {$connectionName} LDAP directory");
            $connection = Container::getConnection($connectionName);
            
            // Query for the user with uid attribute
            Log::debug("Executing LDAP query for uid={$username} in {$connectionName}");
            $results = $connection->query()
                ->where('uid', '=', $username)
                ->get();

            Log::info("LDAP query returned " . count($results) . " result(s) for {$connectionName}");

            if (empty($results) || count($results) === 0) {
                Log::debug("No results found for user: {$username} in {$connectionName}");
                return null;
            }

            // Get the first result
            $ldapUser = $results[0];
            Log::debug("First LDAP result type: " . gettype($ldapUser), ['result_keys' => is_array($ldapUser) ? array_keys($ldapUser) : 'object']);

            // Handle edge case where result might be an array instead of object
            if (is_array($ldapUser)) {
                Log::info("LDAP result is array in {$connectionName}, extracting attributes from array format");
                
                // Handle LDAP array format where values are typically in indexed arrays
                $userData = [
                    'username' => isset($ldapUser['uid']) 
                        ? (is_array($ldapUser['uid']) ? $ldapUser['uid'][0] : $ldapUser['uid'])
                        : $username,
                    'name' => isset($ldapUser['cn']) 
                        ? (is_array($ldapUser['cn']) ? $ldapUser['cn'][0] : $ldapUser['cn'])
                        : (isset($ldapUser['displayname']) 
                            ? (is_array($ldapUser['displayname']) ? $ldapUser['displayname'][0] : $ldapUser['displayname'])
                            : $username),
                    'email' => isset($ldapUser['mail']) 
                        ? (is_array($ldapUser['mail']) ? $ldapUser['mail'][0] : $ldapUser['mail'])
                        : (isset($ldapUser['mailalternateaddress']) 
                            ? (is_array($ldapUser['mailalternateaddress']) ? $ldapUser['mailalternateaddress'][0] : $ldapUser['mailalternateaddress'])
                            : "{$username}@ncra.tifr.res.in"),
                ];
                
                Log::debug("Extracted user data from array: " . json_encode($userData));
            } else {
                // Standard object handling with getFirstAttribute method
                Log::info("LDAP result is object in {$connectionName}, using getFirstAttribute() method");
                
                $userData = [
                    'username' => $ldapUser->getFirstAttribute('uid') ?? $username,
                    'name' => $ldapUser->getFirstAttribute('cn') ?? $ldapUser->getFirstAttribute('displayname') ?? $username,
                    'email' => $ldapUser->getFirstAttribute('mail') ?? $ldapUser->getFirstAttribute('mailalternateaddress') ?? "{$username}@ncra.tifr.res.in",
                ];
                
                Log::debug("Extracted user data from object", $userData);
            }

            // Validate extracted data
            if (empty($userData['username']) || empty($userData['name'])) {
                Log::warning("Incomplete user data extracted from {$connectionName}", $userData);
                return null;
            }

            Log::info("✓ Successfully extracted user '{$userData['username']}' from {$connectionName}");
            return $userData;

        } catch (Exception $e) {
            Log::error("Error searching {$connectionName}: " . $e->getMessage(), [
                'exception' => $e->getTraceAsString(),
                'username' => $username,
                'connection' => $connectionName
            ]);
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
