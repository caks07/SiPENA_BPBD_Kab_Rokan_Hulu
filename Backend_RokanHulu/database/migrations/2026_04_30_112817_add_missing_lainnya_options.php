<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $tables = [
            'opt_wabah_jenis_penyakit',
            'opt_wabah_sebaran',
            'opt_konflik_sifat',
            'opt_konflik_aktor',
            'opt_konflik_pemicu'
        ];

        foreach ($tables as $table) {
            DB::table($table)->upsert([
                'kode' => 'lainnya',
                'label' => 'Yang lain',
                'urutan' => 99,
                'is_other' => true,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now()
            ], ['kode'], ['label', 'urutan', 'is_other']);
        }

        // Update Keracunan Makanan
        DB::table('opt_wabah_jenis_penyakit')
            ->where('kode', 'keracunan')
            ->update(['label' => 'Keracunan Makanan (Gejala serentak setelah acara tertentu)']);
            
        // Update Lokasi Khusus
        DB::table('opt_wabah_sebaran')
            ->where('kode', 'lokasi_khusus')
            ->update(['label' => 'Lokasi Khusus (Sekolah, Pondok Pesantren, Perkantoran)']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $tables = [
            'opt_wabah_jenis_penyakit',
            'opt_wabah_sebaran',
            'opt_konflik_sifat',
            'opt_konflik_aktor',
            'opt_konflik_pemicu'
        ];

        foreach ($tables as $table) {
            DB::table($table)->where('kode', 'lainnya')->delete();
        }

        DB::table('opt_wabah_jenis_penyakit')
            ->where('kode', 'keracunan')
            ->update(['label' => 'Keracunan Makanan']);
            
        DB::table('opt_wabah_sebaran')
            ->where('kode', 'lokasi_khusus')
            ->update(['label' => 'Lokasi Khusus (Sekolah, Pondok Pesantren)']);
    }
};
