<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use LdapRecord\Container;
use App\Models\User as LocalUser;
use App\Ldap\User as LdapUser; 
use Illuminate\Support\Facades\Gate;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'username' => 'required|string',
            'password' => 'required|string',
            'type'     => 'required', // 0: Local, 1: OpenLDAP, 2: FreeIPA
        ]);

        $username = $request->username;
        $password = $request->password;

        // --- TYPE 0: LOCAL LARAVEL DB ---
if ($request->type == '0') {
    // 1. Manually find the user by username
    $user = \App\Models\User::where('username', $username)->first();

    // 2. If user exists, manually check the password hash
    if ($user && \Illuminate\Support\Facades\Hash::check($password, $user->password)) {
        
        // 3. Log them in manually so Auth::user() works
        \Illuminate\Support\Facades\Auth::login($user);

        $user->tokens()->delete();
        $token = $user->createToken('nita-token')->plainTextToken;

        return response()->json([
            'status' => 'success',
            'token' => $token,
            'user' => $user
        ]);
    }

    return response()->json(['status' => 'error', 'message' => 'Invalid local credentials'], 401);
}

        // --- TYPE 1 & 2: LDAP (OpenLDAP & FreeIPA) ---
        $connectionName = ($request->type == '1') ? 'openldap' : 'freeipa';
        
        try {
            $ldapUser = LdapUser::on($connectionName)
                            ->where('uid', '=', $username)
                            ->first();

            if ($ldapUser) {
                $userDn = $ldapUser->getDn();
                $connection = Container::getConnection($connectionName);

                if ($connection->auth()->attempt($userDn, $password)) {
                    
                    // SYNC TO LOCAL DATABASE (Keep local shadow copy for Sanctum)
                    $user = LocalUser::updateOrCreate(
                        ['username' => $username],
                        [
                            'name' => $ldapUser->getFirstAttribute('cn') ?? $username,
                            'password' => Hash::make(Str::random(32)), // Random pass for LDAP users
                        ]
                    );

                    $token = $user->createToken('nita-api-token')->plainTextToken;

                    return response()->json([
                        'status' => 'success',
                        'source' => $connectionName,
                        'token' => $token, 
                        'user' => $user
                    ]);
                } 
            }
            
            return response()->json(['status' => 'error', 'message' => 'Invalid LDAP/IPA credentials'], 401);

        } catch (\Exception $e) {
            return response()->json(['status' => 'error', 'message' => 'Auth System Error: ' . $e->getMessage()], 500);
        }
    }

    public function me(Request $request) {
        return response()->json([
            'user' => $request->user(),
            'capabilities' => [
                'admin' => $request->user()->username === 'admin',
                // Add more Gates here
            ]
        ]);
    }
}