<?php
namespace App\Http\Controllers;
use Illuminate\Support\Facades\DB;

class GeoJsonController extends Controller
{
    /**
     * GeoJSON FeatureCollection untuk batas wilayah kecamatan.
     * Features yang tidak punya polygon (geometry null) tetap disertakan
     * tapi dengan geometry null — Leaflet GeoJSON akan skip otomatis.
     */
    public function kecamatan()
    {
        $rows = DB::select("
            SELECT
                id,
                kode_kecamatan,
                nama_kecamatan,
                CAST(latitude_default  AS float) AS lat,
                CAST(longitude_default AS float) AS lng,
                CASE
                    WHEN polygon IS NOT NULL
                    THEN ST_AsGeoJSON(polygon)::text
                    ELSE NULL
                END AS geojson_polygon
            FROM kecamatan
            WHERE is_active = true
            ORDER BY nama_kecamatan
        ");

        $features = array_map(function ($row) {
            $geom = ($row->geojson_polygon !== null)
                ? json_decode($row->geojson_polygon)
                : null;

            return [
                'type'       => 'Feature',
                'properties' => [
                    'id'                => $row->id,
                    'kode_kecamatan'    => $row->kode_kecamatan,
                    'nama_kecamatan'    => $row->nama_kecamatan,
                    'latitude_default'  => $row->lat,
                    'longitude_default' => $row->lng,
                ],
                'geometry' => $geom,
            ];
        }, $rows);

        return response()->json([
            'type'     => 'FeatureCollection',
            'features' => $features,
        ]);
    }

    /**
     * Daftar kecamatan sederhana untuk dropdown form (tanpa PostGIS).
     */
    public function listKecamatan()
    {
        $rows = DB::table('kecamatan')
            ->where('is_active', true)
            ->orderBy('nama_kecamatan')
            ->get(['id', 'kode_kecamatan', 'nama_kecamatan',
                   'latitude_default', 'longitude_default']);

        return response()->json($rows);
    }
}
