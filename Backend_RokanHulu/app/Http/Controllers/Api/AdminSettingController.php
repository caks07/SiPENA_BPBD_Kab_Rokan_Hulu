<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

/**
 * AdminSettingController
 *
 * Mengelola pengaturan sistem: password form laporan.
 * Semua endpoint memerlukan auth:sanctum + role admin.
 */
class AdminSettingController extends Controller
{
    /**
     * GET /api/admin/settings/form-password-status
     * Cek apakah password form sudah diatur (hanya return bool).
     */
    public function formPasswordStatus()
    {
        $hashExists = DB::table('system_settings')
            ->where('key', 'report_form_password_hash')
            ->exists();

        $plainSetting = DB::table('system_settings')
            ->where('key', 'report_form_password_plain')
            ->first();

        // Default seeded password is 'rohultanggap'
        $plainPassword = $plainSetting ? $plainSetting->value : ($hashExists ? 'rohultanggap' : null);

        return response()->json([
            'is_set' => $hashExists,
            'password_plain' => $plainPassword
        ]);
    }

    /**
     * PATCH /api/admin/settings/form-password
     * Ganti password form laporan.
     *
     * Body: { "password": "...", "password_confirmation": "..." }
     */
    public function updateFormPassword(Request $request)
    {
        $request->validate([
            'password' => 'required|string|min:8|confirmed',
        ], [
            'password.min'       => 'Password minimal 8 karakter.',
            'password.confirmed' => 'Konfirmasi password tidak sesuai.',
        ]);

        $hash = Hash::make($request->password);
        $plain = $request->password;

        DB::table('system_settings')->updateOrInsert(
            ['key' => 'report_form_password_hash'],
            ['value' => $hash, 'updated_at' => now(), 'created_at' => now()]
        );

        DB::table('system_settings')->updateOrInsert(
            ['key' => 'report_form_password_plain'],
            ['value' => $plain, 'updated_at' => now(), 'created_at' => now()]
        );

        return response()->json([
            'message' => 'Password akses form laporan berhasil diperbarui.',
            'password_plain' => $plain,
        ]);
    }
}
