<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class OptionController extends Controller
{
    public function index(string $table)
    {
        if (! Str::startsWith($table, 'opt_')) {
            return response()->json(['message' => 'Table option tidak valid.'], 422);
        }

        $rows = DB::table($table)
            ->when(
                $this->hasColumn($table, 'is_active'),
                fn ($query) => $query->where('is_active', true)
            )
            ->orderBy('urutan')
            ->get();

        return response()->json($rows);
    }

    public function kecamatanGeojson()
    {
        $rows = DB::table('kecamatan')
            ->select(['id', 'nama_kecamatan', DB::raw('ST_AsGeoJSON(polygon) as geometry')])
            ->where('is_active', true)
            ->get()
            ->map(function ($row) {
                return [
                    'type' => 'Feature',
                    'properties' => [
                        'id' => $row->id,
                        'nama_kecamatan' => $row->nama_kecamatan,
                    ],
                    'geometry' => json_decode((string) $row->geometry, true),
                ];
            });

        return response()->json(['type' => 'FeatureCollection', 'features' => $rows]);
    }

    private function hasColumn(string $table, string $column): bool
    {
        $result = DB::selectOne(
            "SELECT EXISTS (
                SELECT 1
                FROM information_schema.columns
                WHERE table_name = ? AND column_name = ?
            ) AS has_column",
            [$table, $column]
        );

        return (bool) ($result->has_column ?? false);
    }
}
