# DEPLOY DATABASE — SiPENA BPBD Rokan Hulu
> Versi: 2026-05-06 | Backend: Laravel + PostgreSQL

---

## Prasyarat Server

```bash
# Install PostgreSQL 14+ dengan ekstensi PostGIS
sudo apt install postgresql postgresql-contrib postgis
# Aktifkan extension
psql -U postgres -c "CREATE EXTENSION IF NOT EXISTS postgis;"
```

---

## Langkah Deployment Pertama Kali

### 1. Buat database produksi

```bash
psql -U postgres -c "CREATE DATABASE sipena_prod;"
psql -U postgres -d sipena_prod -c "CREATE EXTENSION IF NOT EXISTS postgis;"
```

### 2. Konfigurasi `.env`

```env
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=sipena_prod
DB_USERNAME=postgres
DB_PASSWORD=your_secure_password
```

### 3. Import baseline schema

```bash
psql -U postgres -d sipena_prod -f database/schema/bpbd_baseline_schema.sql
```

> **Alternatif jika pg_dump tidak tersedia:** Jalankan migrasi biasa (lihat langkah 4).

### 4. Jalankan migrasi (opsional jika tidak menggunakan baseline SQL)

```bash
php artisan migrate
```

### 5. Jalankan seeder

```bash
php artisan db:seed
```

Ini akan menjalankan secara berurutan:
1. `ReferenceOptionsSeeder` — data master (roles, kecamatan, semua tabel opt_*)
2. `UserAccountSeeder` — 18 akun user final

---

## Rollback / Reset

```bash
# Reset database test saja (JANGAN di produksi)
php artisan migrate:fresh --seed
```

---

## Daftar Akun Final

### Admin & Pimpinan

| Username         | Password              | Role     | Kecamatan |
|------------------|-----------------------|----------|-----------|
| adminkabupaten   | rohultanggapdarurat   | admin    | —         |
| kepalabpbd       | rohultanggapdarurat   | pimpinan | —         |

### Operator Kecamatan (role: operator)

| Username       | Password                      | Kecamatan               |
|----------------|-------------------------------|-------------------------|
| bangunpurba    | bangunpurbatanggapdarurat     | Bangun Purba            |
| bonai          | bonaitanggapdarurat           | Bonai Darussalam        |
| kabun          | kabuntanggapdarurat           | Kabun                   |
| kepenuhan      | kepenuhantanggapdarurat       | Kepenuhan               |
| kepenuhanhulu  | kepenuhanhulutanggapdarurat   | Kepenuhan Hulu          |
| kunto          | kuntotanggapdarurat           | Kunto Darussalam        |
| pagarantapah   | pagarantapahtanggapdarurat    | Pagaran Tapah Darussalam|
| pendalian      | pendaliantanggapdarurat       | Pendalian IV Koto       |
| rambah         | rambahtanggapdarurat          | Rambah                  |
| rambahhilir    | rambahhilirtanggapdarurat     | Rambah Hilir            |
| rambahsamo     | rambahsamotanggapdarurat      | Rambah Samo             |
| rokan          | rokantanggapdarurat           | Rokan IV Koto           |
| tambusai       | tambusaitanggapdarurat        | Tambusai                |
| tambura        | tamburatanggapdarurat         | Tambusai Utara          |
| tandun         | tanduntanggapdarurat          | Tandun                  |
| ujungbatu      | ujungbatutanggapdarurat       | Ujung Batu              |

> Segera ganti semua password setelah deployment pertama.

---

## Roles yang Dipakai

| nama_role | Keterangan         | Akses                        |
|-----------|--------------------|------------------------------|
| admin     | Admin Kabupaten    | Semua fitur                  |
| pimpinan  | Kepala BPBD        | Dashboard, baca laporan       |
| operator  | Admin Kecamatan    | Input & lihat laporan kecamatan sendiri |

---

## Login API

- **Endpoint:** `POST /api/auth/login`
- **Payload:** `{ "username": "...", "password": "..." }`
- **Credential:** Username (bukan email)
- **Password:** Di-hash menggunakan `Hash::make()` Laravel (bcrypt)

---

## User Lama yang Perlu Dinonaktifkan

User berikut adalah sisa seeder lama dan perlu dinonaktifkan atau dihapus setelah konfirmasi:

| ID | Username          | Name                     | Alasan                        |
|----|-------------------|--------------------------|-------------------------------|
| 1  | admin_kab         | Admin Kabupaten          | Diganti `adminkabupaten`      |
| 2  | kepala_bpbd       | Kepala BPBD              | Diganti `kepalabpbd`          |
| 3  | admin_rambah      | Admin Kecamatan Rambah   | Diganti `rambah`              |
| 4  | admin_rambah_samo | Admin Kecamatan Rambah Samo | Diganti `rambahsamo`       |

Untuk nonaktifkan:
```sql
UPDATE users SET is_active = false
WHERE username IN ('admin_kab','kepala_bpbd','admin_rambah','admin_rambah_samo');
```

Untuk hapus permanen (setelah konfirmasi):
```sql
DELETE FROM users
WHERE username IN ('admin_kab','kepala_bpbd','admin_rambah','admin_rambah_samo');
```

---

## File yang Dibuat / Dimodifikasi

| File | Status |
|------|--------|
| `database/schema/bpbd_baseline_schema.sql` | Dibuat (baseline schema lengkap) |
| `database/seeders/ReferenceOptionsSeeder.php` | Dibuat (roles, kecamatan, semua opt_*) |
| `database/seeders/UserAccountSeeder.php` | Dibuat (18 akun user final) |
| `database/seeders/DatabaseSeeder.php` | Diupdate |
| `database/migrations_backup_20260506/` | Backup semua migrasi lama (11 file) |
| `database/seeders_backup_20260506/` | Backup seeder lama |
