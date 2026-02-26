<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Gate;

class CheckServiceAccess
{
    public function handle(Request $request, Closure $next, string $service): Response
    {
        // Check the gate we defined in AppServiceProvider
        if (Gate::denies('access-service', $service)) {
            return response()->json([
                'error' => 'Access Denied',
                'message' => "Your role does not have permission to access the [$service] service."
            ], 403);
        }

        return $next($request);
    }
}