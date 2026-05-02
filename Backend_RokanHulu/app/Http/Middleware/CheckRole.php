<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $role = strtolower((string) ($request->user()?->role?->nama_role ?? $request->header('X-User-Role', '')));
        $kecamatanId = (int) ($request->user()?->kecamatan_id ?? $request->header('X-Kecamatan-Id', 0));

        if ($role === '' || ! in_array($role, $roles, true)) {
            return response()->json([
                'message' => 'Anda tidak memiliki akses untuk fitur ini.',
            ], Response::HTTP_FORBIDDEN);
        }

        $request->attributes->set('current_role', $role);
        $request->attributes->set('current_kecamatan_id', $kecamatanId);

        return $next($request);
    }
}
