<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Migration: Fix kecamatan data
 * - Rename "Rambah Samo II" → "Bangun Purba" (sesuai GeoJSON MapRohul)
 * - Update semua latitude_default/longitude_default ke centroid polygon GeoJSON
 * - Centroid dihitung dari rata-rata titik polygon (arithmetic mean of vertices)
 */
return new class extends Migration {
    public function up(): void
    {
        // Centroid dari GeoJSON MapRohul.geojson (dihitung via node.js arithmetic mean)
        $centroids = [
            'Tambusai Utara'           => ['lat' => 1.275649, 'lng' => 100.254024],
            'Tambusai'                 => ['lat' => 1.051850, 'lng' => 100.195799],
            'Kepenuhan'                => ['lat' => 1.204929, 'lng' => 100.632461],
            'Bonai Darussalam'         => ['lat' => 1.268177, 'lng' => 100.852487],
            'Bangun Purba'             => ['lat' => 0.923035, 'lng' => 100.180455],
            'Kunto Darussalam'         => ['lat' => 0.875898, 'lng' => 100.651526],
            'Rambah'                   => ['lat' => 0.817653, 'lng' => 100.242252],
            'Pagaran Tapah Darussalam' => ['lat' => 0.784875, 'lng' => 100.601157],
            'Tandun'                   => ['lat' => 0.596585, 'lng' => 100.617389],
            'Rokan IV Koto'            => ['lat' => 0.584637, 'lng' => 100.325796],
            'Ujung Batu'               => ['lat' => 0.698903, 'lng' => 100.539487],
            'Rambah Hilir'             => ['lat' => 0.987446, 'lng' => 100.356578],
            'Kabun'                    => ['lat' => 0.456143, 'lng' => 100.746557],
            'Pendalian IV Koto'        => ['lat' => 0.490602, 'lng' => 100.486788],
            'Kepenuhan Hulu'           => ['lat' => 0.965211, 'lng' => 100.488346],
            'Rambah Samo'              => ['lat' => 0.801450, 'lng' => 100.418951],
        ];

        // 1. Rename "Rambah Samo II" → "Bangun Purba" (kode: 1401160)
        DB::table('kecamatan')
            ->where('kode_kecamatan', '1401160')
            ->update([
                'nama_kecamatan'    => 'Bangun Purba',
                'latitude_default'  => 0.923035,
                'longitude_default' => 100.180455,
                'titik_default'     => DB::raw("ST_SetSRID(ST_MakePoint(100.180455, 0.923035), 4326)"),
                'updated_at'        => now(),
            ]);

        // 2. Update semua kecamatan lain dengan centroid GeoJSON yang akurat
        foreach ($centroids as $nama => $c) {
            if ($nama === 'Bangun Purba') continue; // sudah di-handle di atas
            DB::table('kecamatan')
                ->where('nama_kecamatan', $nama)
                ->update([
                    'latitude_default'  => $c['lat'],
                    'longitude_default' => $c['lng'],
                    'titik_default'     => DB::raw("ST_SetSRID(ST_MakePoint({$c['lng']}, {$c['lat']}), 4326)"),
                    'updated_at'        => now(),
                ]);
        }
    }

    public function down(): void
    {
        // Kembalikan nama lama (rollback)
        DB::table('kecamatan')
            ->where('kode_kecamatan', '1401160')
            ->update([
                'nama_kecamatan'    => 'Rambah Samo II',
                'latitude_default'  => 0.9234,
                'longitude_default' => 100.2765,
                'updated_at'        => now(),
            ]);
    }
};
