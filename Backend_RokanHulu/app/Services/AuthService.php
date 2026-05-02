<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Symfony\Component\HttpKernel\Exception\UnauthorizedHttpException;

class AuthService
{
    public function login(string $username, string $password): array
    {
        $user = User::query()
            ->with(['role', 'kecamatan'])
            ->where('username', $username)
            ->where('is_active', true)
            ->first();

        if (! $user || ! Hash::check($password, (string) $user->password_hash)) {
            throw new UnauthorizedHttpException('sanctum', 'Username atau password salah.');
        }

        $user->update(['last_login_at' => now()]);
        $token = $user->createToken('sipena-web')->plainTextToken;

        return [
            'token' => $token,
            'user' => $user,
            'role' => $user->role?->nama_role,
        ];
    }
}
