<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use LdapRecord\Container;
use App\Models\User as LocalUser;
use App\Ldap\User as LdapUser; 

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
        $user = null;

        // --- TYPE 0: LOCAL LARAVEL DB ---
        if ($request->type == '0') {
            $user = LocalUser::where('username', $username)->first();

            if (!$user || !Hash::check($password, $user->password)) {
                return response()->json(['status' => 'error', 'message' => 'Invalid local credentials'], 401);
            }
        } 
        // --- TYPE 1 & 2: LDAP (OpenLDAP & FreeIPA) ---
        else {
            $connectionName = ($request->type == '1') ? 'openldap' : 'freeipa';
            
            try {
                $ldapUser = LdapUser::on($connectionName)
                                ->where('uid', '=', $username)
                                ->first();

                if ($ldapUser) {
                    $userDn = $ldapUser->getDn();
                    $connection = Container::getConnection($connectionName);

                    if ($connection->auth()->attempt($userDn, $password)) {
                        // SYNC TO LOCAL DATABASE (Keep local shadow copy)
                        $user = LocalUser::updateOrCreate(
                            ['username' => $username],
                            [
                                'name' => $ldapUser->getFirstAttribute('cn') ?? $username,
                                'password' => Hash::make(Str::random(32)),
                                'type' => $request->type
                            ]
                        );
                    } 
                }

                if (!$user) {
                    return response()->json(['status' => 'error', 'message' => 'Invalid LDAP/IPA credentials'], 401);
                }

            } catch (\Exception $e) {
                return response()->json(['status' => 'error', 'message' => 'Auth System Error: ' . $e->getMessage()], 500);
            }
        }

        // --- UNIFIED SUCCESS PATH ---
        // 1. Delete old tokens
        $user->tokens()->delete();

        // 2. Generate new token
        $token = $user->createToken('nita-token')->plainTextToken;

        // 3. IMPORTANT: Load the roles so the frontend "isAdmin" logic works!
        return response()->json([
            'status' => 'success',
            'token'  => $token,
            'user'   => $user->load('roles'), 
        ]);
    }

    public function me(Request $request) {
        // Load roles here too so the /me endpoint stays consistent
        $user = $request->user()->load('roles');
        
        return response()->json([
            'user' => $user,
            'capabilities' => [
                'admin' => $user->roles()->where('name', 'admin')->exists(),
            ]
        ]);
    }
}