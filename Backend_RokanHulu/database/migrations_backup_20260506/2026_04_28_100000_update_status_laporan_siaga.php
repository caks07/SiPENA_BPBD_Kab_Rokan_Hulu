<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        // 1. Buat type enum baru
        DB::statement("CREATE TYPE status_laporan_new AS ENUM('siaga1','siaga2','siaga3','selesai')");

        // 2. Drop default dulu agar bisa ALTER TYPE
        DB::statement("ALTER TABLE laporan_bencana ALTER COLUMN status DROP DEFAULT");

        // 3. Konversi kolom ke type baru (petakan nilai lama → baru)
        DB::statement("
            ALTER TABLE laporan_bencana
            ALTER COLUMN status TYPE status_laporan_new
            USING (
                CASE status::text
                    WHEN 'baru'        THEN 'siaga3'
                    WHEN 'diverifikasi'THEN 'siaga2'
                    WHEN 'diproses'    THEN 'siaga1'
                    WHEN 'selesai'     THEN 'selesai'
                    WHEN 'dibatalkan'  THEN 'selesai'
                    ELSE 'siaga3'
                END
            )::status_laporan_new
        ");

        // 4. Set default baru
        DB::statement("ALTER TABLE laporan_bencana ALTER COLUMN status SET DEFAULT 'siaga3'");

        // 5. Drop type lama
        DB::statement("DROP TYPE IF EXISTS status_laporan CASCADE");

        // 6. Rename type baru ke nama canonical
        DB::statement("ALTER TYPE status_laporan_new RENAME TO status_laporan");

        // 7. Tambah kolom catatan_update
        DB::statement("ALTER TABLE laporan_bencana ADD COLUMN IF NOT EXISTS catatan_update text");

        // 8. Pastikan severity_level punya default
        DB::statement("ALTER TABLE laporan_bencana ALTER COLUMN severity_level SET DEFAULT 3");
    }

    public function down(): void
    {
        DB::statement("CREATE TYPE status_laporan_old AS ENUM('baru','diverifikasi','diproses','selesai','dibatalkan')");
        DB::statement("ALTER TABLE laporan_bencana ALTER COLUMN status DROP DEFAULT");
        DB::statement("
            ALTER TABLE laporan_bencana
            ALTER COLUMN status TYPE status_laporan_old
            USING (
                CASE status::text
                    WHEN 'siaga1'  THEN 'diproses'
                    WHEN 'siaga2'  THEN 'diverifikasi'
                    WHEN 'siaga3'  THEN 'baru'
                    WHEN 'selesai' THEN 'selesai'
                    ELSE 'baru'
                END
            )::status_laporan_old
        ");
        DB::statement("ALTER TABLE laporan_bencana ALTER COLUMN status SET DEFAULT 'baru'");
        DB::statement("DROP TYPE IF EXISTS status_laporan CASCADE");
        DB::statement("ALTER TYPE status_laporan_old RENAME TO status_laporan");
        DB::statement("ALTER TABLE laporan_bencana DROP COLUMN IF EXISTS catatan_update");
    }
};
