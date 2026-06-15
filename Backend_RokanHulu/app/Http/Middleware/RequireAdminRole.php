<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

/**
 * RequireAdminRole
 *
 * Middleware yang memastikan user yang sudah auth (via Sanctum)
 * memiliki role 'admin'. Menggunakan nama_role sesuai codebase existing.
 *
 * Cara penggunaan: tambahkan ke route group admin.
 */
class RequireAdminRole
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['error' => 'Unauthenticated.'], 401);
        }

        // Field role yang benar sesuai model User existing: $user->role->nama_role
        $roleName = $user->role?->nama_role ?? null;

        if ($roleName !== 'admin') {
            return response()->json([
                'error' => 'Akses ditolak. Hanya admin kabupaten yang dapat mengakses fitur ini.',
            ], 403);
        }

        return $next($request);
    }
}
