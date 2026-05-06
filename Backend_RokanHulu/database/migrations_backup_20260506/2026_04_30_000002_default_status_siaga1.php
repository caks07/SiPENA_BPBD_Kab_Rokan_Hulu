<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Migration: Ubah default status laporan baru dari 'siaga3' → 'siaga1'
 * Laporan baru yang masuk harus langsung dianggap siaga tertinggi (bahaya)
 */
return new class extends Migration {
    public function up(): void
    {
        // Ubah DEFAULT kolom status dari siaga3 → siaga1
        DB::statement("ALTER TABLE laporan_bencana ALTER COLUMN status SET DEFAULT 'siaga1'");
        // Ubah DEFAULT severity_level dari 3 → 1
        DB::statement("ALTER TABLE laporan_bencana ALTER COLUMN severity_level SET DEFAULT 1");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE laporan_bencana ALTER COLUMN status SET DEFAULT 'siaga3'");
        DB::statement("ALTER TABLE laporan_bencana ALTER COLUMN severity_level SET DEFAULT 3");
    }
};
