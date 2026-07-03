<?php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\LaporanController;
use App\Http\Controllers\GeoJsonController;
use App\Http\Controllers\OptionsController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\FormAccessController;
use App\Http\Controllers\Api\AdminAccountController;
use App\Http\Controllers\Api\ManualBookController;
use App\Http\Controllers\Api\AdminSettingController;

// ─── Fallback login name (Sanctum needs this) ───────────────────────────────
Route::get('/login', function () {
    return response()->json(['message' => 'Unauthenticated.'], 401);
})->name('login');

// ─── Public Routes ───────────────────────────────────────────────────────────
Route::post('/auth/login', [AuthController::class, 'login']);
Route::get('/geojson/kecamatan', [GeoJsonController::class, 'kecamatan']);
Route::get('/kecamatan', [GeoJsonController::class, 'listKecamatan']);
Route::get('/options/{jenis}', [OptionsController::class, 'getOptions']);

// Password gate untuk form laporan publik (throttle: 10x/menit)
Route::post('/form-access/verify', [FormAccessController::class, 'verify'])
     ->middleware('throttle:100,1');

// POST laporan — masih public, tapi wajib X-Form-Access-Token di header
// Token diverifikasi di LaporanController::store()
Route::post('/laporan', [LaporanController::class, 'store']);

// ─── Authenticated Routes (Dashboard Admin) ──────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);

    Route::get('/laporan', [LaporanController::class, 'index']);
    Route::post('/laporan/bulk-restore', [LaporanController::class, 'bulkRestore']);
    Route::post('/laporan/bulk-force-delete', [LaporanController::class, 'bulkForceDelete']);
    Route::get('/laporan/{id}', [LaporanController::class, 'show']);
    Route::put('/laporan/{id}', [LaporanController::class, 'update']);
    Route::delete('/laporan/{id}', [LaporanController::class, 'destroy']);

    Route::get('/dashboard', [DashboardController::class, 'index']);
    Route::get('/dashboard/map', [DashboardController::class, 'map']);
    Route::get('/dashboard/statistik', [DashboardController::class, 'statistik']);
    Route::get('/dashboard/infografis', [DashboardController::class, 'infografis']);
    Route::get('/dashboard/rekap-kecamatan', [DashboardController::class, 'rekapKecamatan']);

    Route::get('/rekap/kabupaten', [DashboardController::class, 'rekapKabupaten']);
    Route::get('/rekap/kecamatan', [DashboardController::class, 'rekapKecamatan']);
    Route::get('/infografis', [DashboardController::class, 'infografis']);

    Route::get('/manual-books', [ManualBookController::class, 'index']);
    Route::get('/manual-books/{id}/download', [ManualBookController::class, 'download']);

    // ─── Admin-only Routes ───────────────────────────────────────────────────
    Route::middleware('admin.role')->prefix('admin')->group(function () {
        // Log Aktivitas
        Route::get('/activity-logs', [AdminAccountController::class, 'activityLogs']);

        // Manajemen Akun Dashboard
        Route::get('/accounts', [AdminAccountController::class, 'index']);
        Route::post('/accounts', [AdminAccountController::class, 'store']);
        Route::put('/accounts/{id}', [AdminAccountController::class, 'update']);
        Route::patch('/accounts/{id}/password', [AdminAccountController::class, 'changePassword']);
        Route::patch('/accounts/{id}/toggle-active', [AdminAccountController::class, 'toggleActive']);
        Route::delete('/accounts/{id}', [AdminAccountController::class, 'destroy']);

        // Manual Book
        Route::get('/manual-books', [ManualBookController::class, 'index']);
        Route::post('/manual-books', [ManualBookController::class, 'store']);
        Route::get('/manual-books/{id}/download', [ManualBookController::class, 'download']);
        Route::delete('/manual-books/{id}', [ManualBookController::class, 'destroy']);

        // Pengaturan Password Form
        Route::get('/settings/form-password-status', [AdminSettingController::class, 'formPasswordStatus']);
        Route::patch('/settings/form-password', [AdminSettingController::class, 'updateFormPassword']);
    });
});
