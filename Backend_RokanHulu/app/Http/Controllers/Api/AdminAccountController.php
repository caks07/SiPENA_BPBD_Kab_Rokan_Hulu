<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

/**
 * AdminAccountController
 *
 * Mengelola akun dashboard (admin, pimpinan, operator).
 * BUKAN untuk akun TRC — tidak ada role TRC di sistem ini.
 *
 * Semua endpoint memerlukan auth:sanctum + role admin.
 */
class AdminAccountController extends Controller
{
    /**
     * GET /api/admin/accounts
     * List semua user. Password tidak pernah dikembalikan.
     */
    public function index()
    {
        $users = DB::table('users as u')
            ->join('roles as r', 'u.role_id', '=', 'r.id')
            ->leftJoin('kecamatan as k', 'u.kecamatan_id', '=', 'k.id')
            ->whereNull('u.deleted_at')
            ->select(
                'u.id', 'u.name', 'u.username', 'u.role_id',
                'r.nama_role as role', 'u.kecamatan_id',
                'k.nama_kecamatan', 'u.is_active', 'u.last_login_at',
                'u.created_at', 'u.updated_at', 'u.password_plain'
            )
            ->orderBy('u.created_at', 'asc')
            ->get();

        return response()->json($users);
    }

    /**
     * POST /api/admin/accounts
     * Buat akun baru.
     */
    public function store(Request $request)
    {
        $request->validate([
            'username'     => 'required|string|min:3|max:50|unique:users,username',
            'name'         => 'required|string|max:120',
            'password'     => 'required|string|min:8|confirmed',
            'role_id'      => 'required|integer|exists:roles,id',
            'kecamatan_id' => 'nullable|integer|exists:kecamatan,id',
            'is_active'    => 'boolean',
        ], [
            'username.unique'   => 'Username sudah digunakan.',
            'password.min'      => 'Password minimal 8 karakter.',
            'password.confirmed'=> 'Konfirmasi password tidak sesuai.',
        ]);

        $id = DB::table('users')->insertGetId([
            'name'           => $request->name,
            'username'       => $request->username,
            'password'       => Hash::make($request->password),
            'password_plain' => $request->password,
            'role_id'        => $request->role_id,
            'kecamatan_id'   => $request->kecamatan_id,
            'is_active'      => $request->input('is_active', true),
            'created_at'     => now(),
            'updated_at'     => now(),
        ]);

        $user = DB::table('users as u')
            ->join('roles as r', 'u.role_id', '=', 'r.id')
            ->where('u.id', $id)
            ->select('u.id', 'u.name', 'u.username', 'r.nama_role as role', 'u.is_active', 'u.password_plain')
            ->first();

        return response()->json($user, 201);
    }

    /**
     * PUT /api/admin/accounts/{id}
     * Edit akun (username, nama, role, kecamatan, status, password).
     */
    public function update(Request $request, $id)
    {
        $user = DB::table('users')->where('id', $id)->whereNull('deleted_at')->first();
        if (!$user) {
            return response()->json(['error' => 'Akun tidak ditemukan.'], 404);
        }

        $request->validate([
            'username'     => "sometimes|string|min:3|max:50|unique:users,username,{$id}",
            'name'         => 'sometimes|string|max:120',
            'role_id'      => 'sometimes|integer|exists:roles,id',
            'kecamatan_id' => 'nullable|integer|exists:kecamatan,id',
            'is_active'    => 'sometimes|boolean',
            'password'     => 'sometimes|nullable|string|min:8|confirmed',
        ], [
            'username.unique'    => 'Username sudah digunakan.',
            'password.min'       => 'Password minimal 8 karakter.',
            'password.confirmed' => 'Konfirmasi password tidak sesuai.',
        ]);

        // Cegah nonaktifkan diri sendiri
        $requestUser = $request->user();
        if ($requestUser->id == $id && $request->has('is_active') && !$request->is_active) {
            return response()->json(['error' => 'Tidak dapat menonaktifkan akun Anda sendiri.'], 422);
        }

        $update = array_filter([
            'name'         => $request->name,
            'username'     => $request->username,
            'role_id'      => $request->role_id,
            'kecamatan_id' => $request->kecamatan_id,
            'updated_at'   => now(),
        ], fn($v) => $v !== null);

        if ($request->has('is_active')) {
            $update['is_active'] = (bool)$request->is_active;
        }

        if ($request->filled('password')) {
            $update['password'] = Hash::make($request->password);
            $update['password_plain'] = $request->password;
        }

        DB::table('users')->where('id', $id)->update($update);

        // Jika password diubah, hapus token lama agar dipaksa login ulang
        if ($request->filled('password')) {
            DB::table('personal_access_tokens')
                ->where('tokenable_type', 'App\\Models\\User')
                ->where('tokenable_id', $id)
                ->delete();
        }

        return response()->json(['message' => 'Akun berhasil diperbarui.']);
    }

    /**
     * PATCH /api/admin/accounts/{id}/password
     * Reset password akun.
     */
    public function changePassword(Request $request, $id)
    {
        $user = DB::table('users')->where('id', $id)->whereNull('deleted_at')->first();
        if (!$user) {
            return response()->json(['error' => 'Akun tidak ditemukan.'], 404);
        }

        $request->validate([
            'password' => 'required|string|min:8|confirmed',
        ], [
            'password.min'       => 'Password minimal 8 karakter.',
            'password.confirmed' => 'Konfirmasi password tidak sesuai.',
        ]);

        DB::table('users')->where('id', $id)->update([
            'password'       => Hash::make($request->password),
            'password_plain' => $request->password,
            'updated_at'     => now(),
        ]);

        // Hapus semua token lama agar paksa login ulang
        DB::table('personal_access_tokens')
            ->where('tokenable_type', 'App\\Models\\User')
            ->where('tokenable_id', $id)
            ->delete();

        return response()->json(['message' => 'Password berhasil diperbarui. Pengguna perlu login ulang.']);
    }

    /**
     * DELETE /api/admin/accounts/{id}
     * Hapus akun (soft delete).
     */
    public function destroy(Request $request, $id)
    {
        $user = DB::table('users')->where('id', $id)->whereNull('deleted_at')->first();
        if (!$user) {
            return response()->json(['error' => 'Akun tidak ditemukan.'], 404);
        }

        // Cegah hapus diri sendiri
        if ($request->user()->id == $id) {
            return response()->json(['error' => 'Tidak dapat menghapus akun Anda sendiri.'], 422);
        }

        // Zero-admin protection: pastikan masih ada admin aktif lain
        $role = DB::table('roles')->where('id', $user->role_id)->first();
        if ($role && $role->nama_role === 'admin') {
            $adminCount = DB::table('users')
                ->join('roles', 'users.role_id', '=', 'roles.id')
                ->where('roles.nama_role', 'admin')
                ->where('users.is_active', true)
                ->whereNull('users.deleted_at')
                ->where('users.id', '!=', $id)
                ->count();

            if ($adminCount === 0) {
                return response()->json([
                    'error' => 'Tidak dapat menghapus admin terakhir yang aktif. Buat akun admin lain terlebih dahulu.',
                ], 422);
            }
        }

        DB::table('users')->where('id', $id)->update([
            'deleted_at' => now(),
            'is_active'  => false,
            'updated_at' => now(),
        ]);

        // Hapus semua token
        DB::table('personal_access_tokens')
            ->where('tokenable_type', 'App\\Models\\User')
            ->where('tokenable_id', $id)
            ->delete();

        return response()->json(['message' => 'Akun berhasil dihapus.']);
    }

    /**
     * PATCH /api/admin/accounts/{id}/toggle-active
     * Aktifkan/nonaktifkan akun.
     */
    public function toggleActive(Request $request, $id)
    {
        $user = DB::table('users')->where('id', $id)->whereNull('deleted_at')->first();
        if (!$user) {
            return response()->json(['error' => 'Akun tidak ditemukan.'], 404);
        }

        // Cegah nonaktifkan diri sendiri
        if ($request->user()->id == $id) {
            return response()->json(['error' => 'Tidak dapat menonaktifkan akun Anda sendiri.'], 422);
        }

        $newActive = !$user->is_active;

        // Zero-admin protection: cegah nonaktifkan admin terakhir
        if (!$newActive) {
            $role = DB::table('roles')->where('id', $user->role_id)->first();
            if ($role && $role->nama_role === 'admin') {
                $adminCount = DB::table('users')
                    ->join('roles', 'users.role_id', '=', 'roles.id')
                    ->where('roles.nama_role', 'admin')
                    ->where('users.is_active', true)
                    ->whereNull('users.deleted_at')
                    ->where('users.id', '!=', $id)
                    ->count();

                if ($adminCount === 0) {
                    return response()->json([
                        'error' => 'Tidak dapat menonaktifkan admin terakhir yang aktif.',
                    ], 422);
                }
            }
        }

        DB::table('users')->where('id', $id)->update([
            'is_active'  => $newActive,
            'updated_at' => now(),
        ]);

        if (!$newActive) {
            DB::table('personal_access_tokens')
                ->where('tokenable_type', 'App\\Models\\User')
                ->where('tokenable_id', $id)
                ->delete();
        }

        return response()->json([
            'message'   => $newActive ? 'Akun berhasil diaktifkan.' : 'Akun berhasil dinonaktifkan.',
            'is_active' => $newActive,
        ]);
    }
}
