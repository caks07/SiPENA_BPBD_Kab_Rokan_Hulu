<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("
            CREATE TABLE activity_logs (
                id         bigserial PRIMARY KEY,
                user_id    bigint    REFERENCES users(id) ON DELETE SET NULL,
                aksi       varchar(50) NOT NULL,
                catatan    text,
                ip_address varchar(45),
                created_at timestamp NOT NULL DEFAULT now()
            )
        ");
        DB::statement("CREATE INDEX idx_activity_logs_user ON activity_logs(user_id)");
        DB::statement("CREATE INDEX idx_activity_logs_created ON activity_logs(created_at)");
    }

    public function down(): void
    {
        DB::statement("DROP TABLE IF EXISTS activity_logs CASCADE");
    }
};
