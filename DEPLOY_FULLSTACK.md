# DEPLOY_FULLSTACK.md
# Panduan Deploy SiPENA — Backend (Laravel) & Frontend (React + Vite)
# BPBD Kab. Rokan Hulu

---

## Struktur Project

```
RokanHulu-Project/
├── Backend_RokanHulu/      ← Laravel 12 + PostgreSQL + PostGIS
└── Frontend-RokanHulu/     ← React 19 + Vite + TailwindCSS
```

---

# ══════════════════════════════════════
# BAGIAN A — BACKEND (Laravel)
# ══════════════════════════════════════

## A1. Prasyarat Backend

| Komponen     | Versi Minimum |
|--------------|--------------|
| PHP          | 8.2+         |
| Composer     | 2.x          |
| PostgreSQL   | 14+          |
| PostGIS      | 3.x          |
| PHP Extensions | `pdo_pgsql`, `pgsql`, `mbstring`, `openssl`, `tokenizer`, `xml`, `gd` |

### Cek Versi
```bash
php -v
composer -V
psql --version
```

---

## A2. Instalasi Dependensi Backend

```bash
cd Backend_RokanHulu

# Install PHP packages
composer install --optimize-autoloader --no-dev

# Jika development/local:
composer install
```

---

## A3. Konfigurasi `.env` Backend

Buat file `.env` dari contoh:
```bash
cp .env.example .env
php artisan key:generate
```

Edit `.env` sesuai server:
```env
APP_NAME="SiPENA BPBD Rokan Hulu"
APP_ENV=production          # Ganti ke "local" untuk development
APP_DEBUG=false             # Ganti ke true untuk development
APP_URL=https://api.sipena-rohul.id   # URL backend production

DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=sipena
DB_USERNAME=postgres
DB_PASSWORD=your_secure_password

SESSION_DRIVER=database
CACHE_STORE=database
QUEUE_CONNECTION=database
FILESYSTEM_DISK=local
```

---

## A4. Setup Database & Seeder

```bash
# Pastikan database PostgreSQL sudah dibuat dulu:
# psql -U postgres -c "CREATE DATABASE sipena ENCODING 'UTF8';"
# psql -U postgres -d sipena -c "CREATE EXTENSION IF NOT EXISTS postgis;"

# Jalankan migration + seeder (database kosong)
php artisan migrate:fresh --seed

# Atau jika tidak ingin hapus data yang ada:
php artisan migrate --force
php artisan db:seed --class=ReferenceOptionsSeeder --force
php artisan db:seed --class=UserAccountSeeder --force
```

---

## A5. Menjalankan Backend

### Development (Lokal)
```bash
cd Backend_RokanHulu
php artisan serve
# Berjalan di: http://localhost:8000
```

### Production (dengan web server)
Gunakan **Nginx + PHP-FPM** (direkomendasikan):

#### Konfigurasi Nginx
```nginx
server {
    listen 80;
    server_name api.sipena-rohul.id;
    root /var/www/Backend_RokanHulu/public;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";
    index index.php;
    charset utf-8;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    error_page 404 /index.php;

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
        fastcgi_hide_header X-Powered-By;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

#### Perintah Tambahan Production
```bash
# Optimasi Laravel untuk production
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan optimize

# Set permission folder
chmod -R 775 storage bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache
```

---

## A6. CORS — Konfigurasi untuk Frontend

Edit `config/cors.php`:
```php
'allowed_origins' => [
    'http://localhost:5173',               // Development
    'https://sipena-rohul.id',             // Production frontend
    'https://attach-sanctity-broom.ngrok-free.dev', // Ngrok (sementara)
],
'allowed_methods' => ['*'],
'allowed_headers' => ['*'],
'supports_credentials' => true,
```

---

## A7. API Endpoint Utama

| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| POST | `/api/auth/login` | ❌ | Login user |
| POST | `/api/auth/logout` | ✅ | Logout |
| GET | `/api/auth/me` | ✅ | Data user aktif |
| GET | `/api/kecamatan` | ❌ | Dropdown kecamatan |
| GET | `/api/options/{jenis}` | ❌ | Data opsi form |
| GET | `/api/geojson/kecamatan` | ❌ | GeoJSON peta |
| POST | `/api/laporan` | ❌ | Submit laporan TRC |
| GET | `/api/laporan` | ✅ | List laporan |
| GET | `/api/laporan/{id}` | ✅ | Detail laporan |
| PUT | `/api/laporan/{id}` | ✅ | Update laporan |
| DELETE | `/api/laporan/{id}` | ✅ | Hapus laporan |
| GET | `/api/dashboard` | ✅ | Data dashboard |
| GET | `/api/rekap/kabupaten` | ✅ | Rekap kabupaten |
| GET | `/api/rekap/kecamatan` | ✅ | Rekap kecamatan |

---

---

# ══════════════════════════════════════
# BAGIAN B — FRONTEND (React + Vite)
# ══════════════════════════════════════

## B1. Prasyarat Frontend

| Komponen | Versi |
|----------|-------|
| Node.js  | 18+   |
| npm      | 9+    |

```bash
node -v
npm -v
```

---

## B2. Instalasi Dependensi Frontend

```bash
cd Frontend-RokanHulu
npm install
```

### Dependensi Utama
| Package | Fungsi |
|---------|--------|
| React 19 + React DOM | UI Framework |
| React Router DOM v7 | Client-side routing |
| Axios | HTTP client ke backend |
| Leaflet + React-Leaflet | Peta interaktif |
| Chart.js + React-Chartjs-2 | Grafik/statistik |
| Zustand | State management global |
| TanStack Query | Data fetching & caching |
| jsPDF + html2canvas | Export laporan ke PDF |
| XLSX | Export ke Excel |
| TailwindCSS v4 | Utility CSS |

---

## B3. Konfigurasi `.env` Frontend

Buat file `.env` di folder `Frontend-RokanHulu/`:

### Development (Lokal)
```env
VITE_API_URL=/api
```
> Proxy `/api` → `http://localhost:8000` sudah dikonfigurasi di `vite.config.js`.

### Production (Server)
```env
VITE_API_URL=https://api.sipena-rohul.id/api
```

---

## B4. Menjalankan Frontend

### Development (Lokal)
```bash
cd Frontend-RokanHulu
npm run dev
# Berjalan di: http://localhost:5173
```

### Dengan Ngrok (Expose ke Internet)
```bash
# Terminal 1: Jalankan frontend
npm run dev

# Terminal 2: Expose via ngrok
ngrok http --domain=attach-sanctity-broom.ngrok-free.dev 5173

# Akses dari luar: https://attach-sanctity-broom.ngrok-free.dev
```

> **Catatan:** Domain ngrok sudah dikonfigurasi di `vite.config.js` > `allowedHosts`.

---

## B5. Build Production Frontend

```bash
cd Frontend-RokanHulu

# Set .env untuk production
echo "VITE_API_URL=https://api.sipena-rohul.id/api" > .env.production

# Build
npm run build
# Output: folder dist/
```

### Deploy Hasil Build

#### Opsi 1 — Nginx (Direkomendasikan)
Copy isi folder `dist/` ke web server:
```bash
cp -r dist/* /var/www/sipena-rohul/

# Konfigurasi Nginx untuk SPA (Single Page App)
```

```nginx
server {
    listen 80;
    server_name sipena-rohul.id www.sipena-rohul.id;
    root /var/www/sipena-rohul;
    index index.html;

    # SPA: semua route ke index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

#### Opsi 2 — Vite Preview (Testing saja)
```bash
npm run preview
# Berjalan di: http://localhost:4173
```

#### Opsi 3 — Netlify / Vercel (Cloud)
```bash
# Netlify
netlify deploy --prod --dir=dist

# Vercel
vercel --prod
```

---

---

# ══════════════════════════════════════
# BAGIAN C — JALANKAN BERSAMA (LOKAL)
# ══════════════════════════════════════

## C1. Urutan Menjalankan (Development)

Buka **3 terminal terpisah**:

```bash
# Terminal 1 — Backend
cd Backend_RokanHulu
php artisan serve
# → http://localhost:8000

# Terminal 2 — Frontend
cd Frontend-RokanHulu
npm run dev
# → http://localhost:5173

# Terminal 3 — Ngrok (opsional, untuk akses luar)
ngrok http --domain=attach-sanctity-broom.ngrok-free.dev 5173
```

---

## C2. Checklist Sebelum Jalankan

```
[ ] PostgreSQL service berjalan
[ ] PostGIS extension sudah aktif di database sipena
[ ] php artisan migrate:fresh --seed sudah dijalankan
[ ] Backend .env sudah dikonfigurasi (DB_*, APP_KEY)
[ ] Frontend .env sudah dibuat (VITE_API_URL=/api)
[ ] Port 8000 (backend) dan 5173 (frontend) tidak dipakai proses lain
```

---

## C3. Test Koneksi Backend ↔ Frontend

```bash
# Cek backend jalan
curl http://localhost:8000/api/kecamatan

# Test login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"adminkabupaten","password":"rohultanggapdarurat"}'

# Respons sukses → {"token":"...", "user":{...}}
```

---

---

# ══════════════════════════════════════
# BAGIAN D — TROUBLESHOOTING
# ══════════════════════════════════════

| Error | Penyebab | Solusi |
|-------|----------|--------|
| `CORS error` | Origin frontend tidak diizinkan | Tambahkan URL frontend di `config/cors.php` |
| `401 Unauthenticated` | Token tidak dikirim / expired | Cek `Authorization: Bearer {token}` di header |
| `419 CSRF token mismatch` | Session mismatch | Pastikan `SESSION_DRIVER=database` dan sudah migrasi |
| `503 Service Unavailable` | Laravel maintenance mode | `php artisan up` |
| `postgis not found` | PostGIS belum install | `CREATE EXTENSION postgis;` di psql |
| `npm run build` error | Dependency belum install | `npm install` dahulu |
| `Port 5173 already in use` | Proses lain pakai port | `npx kill-port 5173` |
| `ngrok tunnel expired` | Session ngrok berakhir | Jalankan ulang ngrok |
| `Vite proxy error` | Backend tidak jalan | Pastikan `php artisan serve` aktif di port 8000 |
| `type status_laporan not found` | ENUM belum dibuat | `php artisan migrate:fresh` |

---

## Kontak & Referensi

- **Dokumentasi Database:** `DEPLOY_DATABASE.md`
- **Backend Entry:** `Backend_RokanHulu/`
- **Frontend Entry:** `Frontend-RokanHulu/`
- **API Base URL (dev):** `http://localhost:8000/api`
- **Frontend URL (dev):** `http://localhost:5173`
