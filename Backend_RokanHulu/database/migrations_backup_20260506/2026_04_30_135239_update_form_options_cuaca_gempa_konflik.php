<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Ubah label kekuatan gempa
        DB::table('opt_gempa_kekuatan')->upsert([
            ['kode' => 'lemah', 'label' => 'Lemah: Terasa di dalam rumah, benda gantung bergoyang sedikit.', 'urutan' => 1],
            ['kode' => 'kuat', 'label' => 'Kuat: Orang sulit berdiri, benda-benda berat bergeser/jatuh.', 'urutan' => 2],
            ['kode' => 'sangat_kuat', 'label' => 'Sangat Kuat: Kerusakan bangunan terlihat langsung secara masif.', 'urutan' => 3],
        ], ['kode'], ['label', 'urutan']);

        // 2. Ubah kolom aparat_id (scalar) menjadi aparat_ids (array)
        DB::statement('ALTER TABLE detail_konflik_sosial DROP CONSTRAINT IF EXISTS detail_konflik_sosial_aparat_id_foreign');
        DB::statement('ALTER TABLE detail_konflik_sosial DROP COLUMN IF EXISTS aparat_id');
        DB::statement('ALTER TABLE detail_konflik_sosial ADD COLUMN IF NOT EXISTS aparat_ids smallint[]');
    }

    public function down(): void
    {
        DB::table('opt_gempa_kekuatan')->upsert([
            ['kode' => 'lemah', 'label' => 'Lemah', 'urutan' => 1],
            ['kode' => 'kuat', 'label' => 'Kuat', 'urutan' => 2],
            ['kode' => 'sangat_kuat', 'label' => 'Sangat Kuat', 'urutan' => 3],
        ], ['kode'], ['label', 'urutan']);

        DB::statement('ALTER TABLE detail_konflik_sosial DROP COLUMN IF EXISTS aparat_ids');
        DB::statement('ALTER TABLE detail_konflik_sosial ADD COLUMN IF NOT EXISTS aparat_id smallint REFERENCES opt_konflik_aparat(id)');
    }
};
