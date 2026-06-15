<?php

/**
 * Migration: system_settings + manual_books
 *
 * system_settings: tabel key-value untuk pengaturan aplikasi.
 *   - report_form_password_hash: hash password form laporan publik
 *
 * manual_books: tabel untuk menyimpan file PDF panduan yang dikelola admin.
 */

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // ─── system_settings ─────────────────────────────────────────────────
        DB::statement("DROP TABLE IF EXISTS system_settings CASCADE");
        DB::statement("
            CREATE TABLE system_settings (
                id         bigserial    PRIMARY KEY,
                key        varchar(100) NOT NULL UNIQUE,
                value      text         NOT NULL,
                created_at timestamp    NOT NULL DEFAULT now(),
                updated_at timestamp    NOT NULL DEFAULT now()
            )
        ");

        // ─── manual_books ────────────────────────────────────────────────────
        DB::statement("DROP TABLE IF EXISTS manual_books CASCADE");
        DB::statement("
            CREATE TABLE manual_books (
                id          bigserial    PRIMARY KEY,
                title       varchar(255) NOT NULL,
                file_path   varchar(255) NOT NULL,
                file_name   varchar(255) NOT NULL,
                file_size   bigint,
                uploaded_by bigint       REFERENCES users(id) ON DELETE SET NULL,
                created_at  timestamp    NOT NULL DEFAULT now(),
                updated_at  timestamp    NOT NULL DEFAULT now()
            )
        ");
    }

    public function down(): void
    {
        DB::statement("DROP TABLE IF EXISTS manual_books CASCADE");
        DB::statement("DROP TABLE IF EXISTS system_settings CASCADE");
    }
};
