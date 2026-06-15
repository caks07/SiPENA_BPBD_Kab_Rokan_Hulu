<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * FormAccessController
 *
 * Mengelola akses form laporan publik via password bersama.
 * Ini BUKAN login sistem — tidak ada akun TRC, tidak ada role TRC.
 * Cukup satu password yang disimpan hash-nya di system_settings.
 *
 * Flow:
 *  1. Frontend kirim POST /api/form-access/verify { password }
 *  2. Backend cek vs hash di system_settings
 *  3. Jika cocok → buat cache nonce, return access_token
 *  4. Frontend simpan token di sessionStorage
 *  5. Saat submit laporan: kirim header X-Form-Access-Token
 *  6. LaporanController cek token di cache (hapus setelah sukses)
 */
class FormAccessController extends Controller
{
    /**
     * Verifikasi password form dan kembalikan akses token sementara.
     * Throttle: 10 percobaan per menit per IP.
     *
     * POST /api/form-access/verify
     * Body: { "password": "..." }
     */
    public function verify(Request $request)
    {
        $request->validate([
            'password' => 'required|string',
        ]);

        // Ambil hash dari database
        $setting = DB::table('system_settings')
            ->where('key', 'report_form_password_hash')
            ->first();

        if (!$setting || !Hash::check($request->password, $setting->value)) {
            return response()->json([
                'error' => 'Password akses form tidak sesuai.',
            ], 401);
        }

        // Buat token sementara (40 karakter acak)
        // Disimpan di cache dengan TTL 2 jam
        $token = Str::random(40);
        Cache::put("form_access:{$token}", true, now()->addHours(2));

        return response()->json([
            'success'    => true,
            'access_token' => $token,
            'expires_in' => 7200, // detik
        ]);
    }
}
