<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Services\AuthService;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    public function __construct(private readonly AuthService $authService)
    {
    }

    public function login(LoginRequest $request)
    {
        return response()->json(
            $this->authService->login(
                $request->string('username')->toString(),
                $request->string('password')->toString()
            )
        );
    }

    public function me(Request $request)
    {
        return response()->json($request->user()?->load(['role', 'kecamatan']));
    }

    public function logout(Request $request)
    {
        $request->user()?->currentAccessToken()?->delete();
        return response()->json(['message' => 'Logout berhasil.']);
    }
}
