# DEPLOY_DATABASE — SiPENA BPBD Kab. Rokan Hulu

## 1. Prasyarat Server

| Komponen | Versi |
|----------|-------|
| PostgreSQL | 14+ |
| PostGIS | 3.x |
| PHP | 8.2+ |

## 2. Konfigurasi .env PostgreSQL

```env
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=sipena
DB_USERNAME=postgres
DB_PASSWORD=your_password_here
```

## 3. Setup Database Baru

```sql
-- Di psql sebagai superuser
CREATE DATABASE sipena ENCODING 'UTF8';
\c sipena
CREATE EXTENSION IF NOT EXISTS postgis;
```

## 4. Command Migration & Seeder

```bash
# Deploy ke database kosong (recommended)
php artisan migrate:fresh --seed

# Atau step-by-step
php artisan migrate --force
php artisan db:seed --class=ReferenceOptionsSeeder --force
php artisan db:seed --class=UserAccountSeeder --force
```

## 5. Validasi Post-Deploy

```bash
# Cek jumlah tabel (~75 tabel)
php artisan tinker --execute="echo DB::select(\"SELECT count(*) FROM information_schema.tables WHERE table_schema='public'\")[0]->count;"

# Cek data master
php artisan tinker --execute="echo DB::table('roles')->count().' roles, '.DB::table('kecamatan')->count().' kecamatan, '.DB::table('users')->count().' users';"

# Test login API
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"adminkabupaten","password":"rohultanggapdarurat"}'
```

## 6. Rollback Manual

```bash
# Rollback 1 batch
php artisan migrate:rollback

# Nuclear reset (hapus semua!)
php artisan migrate:reset
```

```sql
-- Atau langsung di psql (HATI-HATI!)
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO public;
```

## 7. Struktur File

```
database/
├── migrations/                            ← AKTIF (1 file)
│   └── 2026_05_06_000000_create_sipena_baseline_final.php
├── migrations_backup_20260506/            ← BACKUP (11 file lama)
├── seeders/                               ← AKTIF (3 seeder)
│   ├── DatabaseSeeder.php
│   ├── ReferenceOptionsSeeder.php
│   └── UserAccountSeeder.php
├── seeders_backup_20260506/               ← BACKUP (2 seeder lama)
└── schema/
    └── bpbd_baseline_schema.sql           ← Referensi SQL bersih
```

## 8. User Default

| Username | Password | Role |
|----------|----------|------|
| `adminkabupaten` | `rohultanggapdarurat` | admin |
| `kepalabpbd` | `rohultanggapdarurat` | pimpinan |
| `bangunpurba` | `bangunpurbatanggapdarurat` | operator |
| `rambah` | `rambahtanggapdarurat` | operator |
| *(+ 12 kecamatan lain)* | | |

> **PENTING:** Ganti semua password setelah deploy ke production!

## 9. Perubahan Final vs Migration Lama

| Item | Sebelum | Final |
|------|---------|-------|
| `status_laporan` ENUM | `{baru,diverifikasi,diproses,selesai,dibatalkan}` | `{siaga1,siaga2,siaga3,selesai}` |
| `laporan_bencana.status` default | `'baru'` | `'siaga1'` |
| `laporan_bencana.severity_level` default | NULL | `1` |
| `laporan_bencana.catatan_update` | tidak ada | text nullable |
| `detail_konflik_sosial.aparat_id` | FK smallint | `aparat_ids smallint[]` |
| `laporan_log` audit columns | tidak ada | `field_changed`, `old_value`, `new_value` json |

## 10. Backup Database Production

```bash
# Backup sebelum deploy
pg_dump -U postgres -Fc sipena > sipena_backup_$(date +%Y%m%d_%H%M).dump

# Restore
pg_restore -U postgres -d sipena_restore --clean sipena_backup_YYYYMMDD_HHMM.dump
```

## 11. Troubleshooting

| Error | Solusi |
|-------|--------|
| `extension "postgis" does not exist` | `CREATE EXTENSION postgis;` di psql |
| `type "status_laporan" already exists` | `php artisan migrate:fresh --seed` |
| `column "aparat_id" does not exist` | Kolom diganti jadi `aparat_ids` (array) |
| `Kecamatan tidak ditemukan` | Jalankan `ReferenceOptionsSeeder` dulu sebelum `UserAccountSeeder` |
