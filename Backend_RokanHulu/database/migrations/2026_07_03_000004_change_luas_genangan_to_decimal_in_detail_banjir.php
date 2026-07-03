<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Alter detail_banjir.luas_genangan to decimal(12,2) with regex-based safe casting
        DB::statement("
            ALTER TABLE detail_banjir 
            ALTER COLUMN luas_genangan TYPE decimal(12,2) 
            USING (
                CASE 
                    WHEN regexp_replace(replace(luas_genangan, ',', '.'), '[^0-9.]', '', 'g') ~ '^[0-9]+(\.[0-9]+)?$' 
                    THEN regexp_replace(replace(luas_genangan, ',', '.'), '[^0-9.]', '', 'g')::numeric 
                    ELSE NULL 
                END
            )
        ");
    }

    public function down(): void
    {
        // Revert to text
        DB::statement("ALTER TABLE detail_banjir ALTER COLUMN luas_genangan TYPE text USING (luas_genangan::text)");
    }
};
