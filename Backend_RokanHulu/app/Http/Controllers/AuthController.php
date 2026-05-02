<?php
namespace App\Http\Controllers;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use App\Models\User;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'username' => 'required|string',
            'password' => 'required|string',
        ]);

        // Cari user aktif
        $user = User::where('username', $request->username)
                    ->where('is_active', true)
                    ->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json(['error' => 'Username atau password salah'], 401);
        }

        $role      = DB::table('roles')->where('id', $user->role_id)->first();
        $kecamatan = $user->kecamatan_id
            ? DB::table('kecamatan')->where('id', $user->kecamatan_id)->first()
            : null;

        // Update last login
        $user->update(['last_login_at' => now()]);

        // Hapus token lama (opsional, hindari token menumpuk)
        $user->tokens()->delete();

        // Buat token Sanctum dengan benar
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user'  => [
                'id'             => $user->id,
                'name'           => $user->name,
                'username'       => $user->username,
                'role'           => $role?->nama_role,
                'kecamatan_id'   => $user->kecamatan_id,
                'kecamatan_nama' => $kecamatan?->nama_kecamatan,
            ],
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out']);
    }

    public function me(Request $request)
    {
        $user      = $request->user();
        $role      = DB::table('roles')->where('id', $user->role_id)->first();
        $kecamatan = $user->kecamatan_id
            ? DB::table('kecamatan')->where('id', $user->kecamatan_id)->first()
            : null;

        return response()->json([
            'id'             => $user->id,
            'name'           => $user->name,
            'username'       => $user->username,
            'role'           => $role?->nama_role,
            'kecamatan_id'   => $user->kecamatan_id,
            'kecamatan_nama' => $kecamatan?->nama_kecamatan,
        ]);
    }
}
