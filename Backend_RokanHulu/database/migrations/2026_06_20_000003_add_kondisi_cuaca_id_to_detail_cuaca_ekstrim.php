<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE detail_cuaca_ekstrim ADD COLUMN kondisi_cuaca_id smallint REFERENCES opt_kondisi_cuaca(id)");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE detail_cuaca_ekstrim DROP COLUMN IF EXISTS kondisi_cuaca_id");
    }
};
