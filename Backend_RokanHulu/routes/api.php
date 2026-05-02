<?php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\LaporanController;
use App\Http\Controllers\GeoJsonController;
use App\Http\Controllers\OptionsController;
use App\Http\Controllers\DashboardController;

// Public Routes
Route::post('/auth/login', [AuthController::class, 'login']);
Route::get('/geojson/kecamatan', [GeoJsonController::class, 'kecamatan']);
Route::get('/kecamatan', [GeoJsonController::class, 'listKecamatan']); // Dropdown list
Route::get('/options/{jenis}', [OptionsController::class, 'getOptions']);
Route::post('/laporan', [LaporanController::class, 'store']); // TRC public

// Authenticated Routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);

    Route::get('/laporan', [LaporanController::class, 'index']);
    Route::get('/laporan/{id}', [LaporanController::class, 'show']);
    Route::put('/laporan/{id}', [LaporanController::class, 'update']);
    Route::delete('/laporan/{id}', [LaporanController::class, 'destroy']);

    Route::get('/dashboard', [DashboardController::class, 'index']);
    Route::get('/dashboard/map', [DashboardController::class, 'map']);
    Route::get('/dashboard/statistik', [DashboardController::class, 'statistik']);
    Route::get('/dashboard/infografis', [DashboardController::class, 'infografis']);      // alias
    Route::get('/dashboard/rekap-kecamatan', [DashboardController::class, 'rekapKecamatan']); // alias lama

    Route::get('/rekap/kabupaten', [DashboardController::class, 'rekapKabupaten']);
    Route::get('/rekap/kecamatan', [DashboardController::class, 'rekapKecamatan']);
    Route::get('/infografis', [DashboardController::class, 'infografis']);
});
