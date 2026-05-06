-- ============================================================
-- SiPENA BPBD Kab. Rokan Hulu — Baseline Schema (FINAL)
-- Generated  : 2026-05-06
-- State       : Final (setelah semua migration + ALTER digabung)
-- PostgreSQL  : >=14 + PostGIS
-- Catatan     : Gunakan file ini sebagai referensi struktur.
--               Untuk deploy gunakan: php artisan migrate:fresh --seed
-- ============================================================

-- Extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- ── ENUM Types ───────────────────────────────────────────────────────────────
CREATE TYPE role_name AS ENUM('admin','pimpinan','operator');
CREATE TYPE sumber_laporan AS ENUM('trc','kecamatan','admin','import');
CREATE TYPE sumber_koordinat AS ENUM('titik_peta','default_kecamatan','manual');
CREATE TYPE jenis_bencana AS ENUM(
    'banjir','banjir_bandang','tanah_longsor','cuaca_ekstrim',
    'kekeringan','karhutla','wabah','gempa_bumi','konflik_sosial'
);
CREATE TYPE status_laporan AS ENUM('siaga1','siaga2','siaga3','selesai');

-- ── Option Tables (template sama untuk 45 tabel) ─────────────────────────────
-- Contoh: opt_kondisi_cuaca (struktur identik untuk semua tabel opt_*)
CREATE TABLE opt_kondisi_cuaca (
    id         smallserial  PRIMARY KEY,
    kode       varchar(80)  NOT NULL UNIQUE,
    label      varchar(255) NOT NULL,
    urutan     int          NOT NULL DEFAULT 1,
    is_other   boolean      NOT NULL DEFAULT false,
    is_active  boolean      NOT NULL DEFAULT true,
    created_at timestamp    NOT NULL DEFAULT now(),
    updated_at timestamp    NOT NULL DEFAULT now()
);
-- (opt_fasilitas_umum, opt_kebutuhan_logistik, opt_banjir_penyebab,
--  opt_banjir_ketinggian, opt_banjir_kondisi_air, opt_bandang_kecepatan_air,
--  opt_bandang_material_terbawa, opt_bandang_kondisi_arus,
--  opt_bandang_kerusakan_infrastruktur, opt_longsor_penyebab,
--  opt_longsor_jenis_lokasi, opt_longsor_akses_transportasi,
--  opt_longsor_material, opt_longsor_potensi_susulan, opt_cuaca_fenomena,
--  opt_cuaca_dampak_pohon, opt_cuaca_kerusakan_bangunan,
--  opt_kekeringan_sektor, opt_kekeringan_kondisi_air, opt_kekeringan_durasi,
--  opt_kekeringan_potensi_risiko, opt_kekeringan_upaya_masyarakat,
--  opt_karhutla_kondisi_api, opt_karhutla_jenis_lahan, opt_karhutla_pemilik_lahan,
--  opt_karhutla_jarak_pemukiman, opt_karhutla_sumber_air, opt_karhutla_akses_lokasi,
--  opt_wabah_jenis_penyakit, opt_wabah_sebaran, opt_wabah_fasilitas_kesehatan,
--  opt_wabah_kondisi_sanitasi, opt_gempa_durasi, opt_gempa_kekuatan,
--  opt_gempa_dampak_struktural, opt_gempa_kerusakan_jalan, opt_gempa_potensi_susulan,
--  opt_gempa_kondisi_warga, opt_konflik_sifat, opt_konflik_aktor,
--  opt_konflik_pemicu, opt_konflik_jumlah_terlibat, opt_konflik_kerusakan_materil,
--  opt_konflik_aparat — struktur identik dengan opt_kondisi_cuaca di atas)

-- ── roles ────────────────────────────────────────────────────────────────────
CREATE TABLE roles (
    id         smallserial PRIMARY KEY,
    nama_role  role_name   NOT NULL UNIQUE,
    keterangan varchar(255),
    created_at timestamp   NOT NULL DEFAULT now(),
    updated_at timestamp   NOT NULL DEFAULT now()
);

-- ── kecamatan ────────────────────────────────────────────────────────────────
CREATE TABLE kecamatan (
    id                bigserial        PRIMARY KEY,
    kode_kecamatan    varchar(20)      NOT NULL UNIQUE,
    nama_kecamatan    varchar(120)     NOT NULL,
    latitude_default  decimal(10,7)    NOT NULL DEFAULT 0,
    longitude_default decimal(10,7)    NOT NULL DEFAULT 0,
    titik_default     geometry(Point,4326),
    polygon           geometry(MultiPolygon,4326),
    is_active         boolean          NOT NULL DEFAULT true,
    created_at        timestamp        NOT NULL DEFAULT now(),
    updated_at        timestamp        NOT NULL DEFAULT now(),
    deleted_at        timestamp
);

-- ── users ────────────────────────────────────────────────────────────────────
CREATE TABLE users (
    id             bigserial    PRIMARY KEY,
    name           varchar(120) NOT NULL,
    username       varchar(50)  NOT NULL UNIQUE,
    password       varchar(255) NOT NULL,
    role_id        smallint     NOT NULL REFERENCES roles(id),
    kecamatan_id   bigint       REFERENCES kecamatan(id),
    is_active      boolean      NOT NULL DEFAULT true,
    last_login_at  timestamp,
    remember_token varchar(100),
    created_at     timestamp    NOT NULL DEFAULT now(),
    updated_at     timestamp    NOT NULL DEFAULT now(),
    deleted_at     timestamp
);

-- ── laporan_bencana ──────────────────────────────────────────────────────────
CREATE TABLE laporan_bencana (
    id                 bigserial        PRIMARY KEY,
    jenis_bencana      jenis_bencana    NOT NULL,
    nama_pelapor       varchar(120)     NOT NULL,
    sumber_laporan     sumber_laporan   NOT NULL DEFAULT 'trc',
    created_by_user_id bigint           REFERENCES users(id),
    kecamatan_id       bigint           NOT NULL REFERENCES kecamatan(id),
    lokasi_text        text             NOT NULL,
    latitude           decimal(10,7)    NOT NULL,
    longitude          decimal(10,7)    NOT NULL,
    location_geom      geometry(Point,4326),
    sumber_koordinat   sumber_koordinat NOT NULL DEFAULT 'titik_peta',
    waktu_kejadian     timestamp        NOT NULL,
    status             status_laporan   NOT NULL DEFAULT 'siaga1',
    severity_level     smallint         NOT NULL DEFAULT 1,
    catatan_update     text,
    is_baru            boolean          NOT NULL DEFAULT true,
    created_at         timestamp        NOT NULL DEFAULT now(),
    updated_at         timestamp        NOT NULL DEFAULT now(),
    deleted_at         timestamp
);
CREATE INDEX idx_laporan_jenis     ON laporan_bencana(jenis_bencana);
CREATE INDEX idx_laporan_kecamatan ON laporan_bencana(kecamatan_id);
CREATE INDEX idx_laporan_status    ON laporan_bencana(status);
CREATE INDEX idx_laporan_waktu     ON laporan_bencana(waktu_kejadian);

-- ── korban_bencana ───────────────────────────────────────────────────────────
CREATE TABLE korban_bencana (
    laporan_id         bigint PRIMARY KEY REFERENCES laporan_bencana(id) ON DELETE CASCADE,
    korban_luka_ringan int    NOT NULL DEFAULT 0,
    korban_luka_berat  int    NOT NULL DEFAULT 0,
    korban_meninggal   int    NOT NULL DEFAULT 0,
    korban_hilang      int    NOT NULL DEFAULT 0,
    kk_mengungsi       int    NOT NULL DEFAULT 0,
    jiwa_mengungsi     int    NOT NULL DEFAULT 0,
    created_at         timestamp NOT NULL DEFAULT now(),
    updated_at         timestamp NOT NULL DEFAULT now()
);

-- ── kerusakan_bencana ────────────────────────────────────────────────────────
CREATE TABLE kerusakan_bencana (
    laporan_id             bigint PRIMARY KEY REFERENCES laporan_bencana(id) ON DELETE CASCADE,
    rumah_rusak_ringan     int    NOT NULL DEFAULT 0,
    rumah_rusak_sedang     int    NOT NULL DEFAULT 0,
    rumah_rusak_berat      int    NOT NULL DEFAULT 0,
    catatan_fasilitas_umum text,
    catatan_lain           text,
    created_at             timestamp NOT NULL DEFAULT now(),
    updated_at             timestamp NOT NULL DEFAULT now()
);

-- ── kerusakan_fasilitas_umum (pivot) ─────────────────────────────────────────
CREATE TABLE kerusakan_fasilitas_umum (
    laporan_id        bigint   REFERENCES laporan_bencana(id) ON DELETE CASCADE,
    fasilitas_umum_id smallint REFERENCES opt_fasilitas_umum(id),
    created_at        timestamp NOT NULL DEFAULT now(),
    PRIMARY KEY(laporan_id, fasilitas_umum_id)
);

-- ── kerusakan_kebutuhan_logistik (pivot) ─────────────────────────────────────
CREATE TABLE kerusakan_kebutuhan_logistik (
    laporan_id            bigint   REFERENCES laporan_bencana(id) ON DELETE CASCADE,
    kebutuhan_logistik_id smallint REFERENCES opt_kebutuhan_logistik(id),
    created_at            timestamp NOT NULL DEFAULT now(),
    PRIMARY KEY(laporan_id, kebutuhan_logistik_id)
);

-- ── laporan_foto ─────────────────────────────────────────────────────────────
CREATE TABLE laporan_foto (
    id         bigserial    PRIMARY KEY,
    laporan_id bigint       NOT NULL REFERENCES laporan_bencana(id) ON DELETE CASCADE,
    file_path  varchar(255) NOT NULL,
    file_name  varchar(255) NOT NULL,
    mime_type  varchar(100),
    file_size  bigint,
    caption    text,
    sort_order int          NOT NULL DEFAULT 1,
    created_at timestamp    NOT NULL DEFAULT now()
);

-- ── laporan_log (+ kolom audit JSON) ─────────────────────────────────────────
CREATE TABLE laporan_log (
    id            bigserial   PRIMARY KEY,
    laporan_id    bigint      NOT NULL REFERENCES laporan_bencana(id) ON DELETE CASCADE,
    user_id       bigint      REFERENCES users(id),
    aksi          varchar(30) NOT NULL,
    catatan       text,
    field_changed json,
    old_value     json,
    new_value     json,
    created_at    timestamp   NOT NULL DEFAULT now()
);

-- ── personal_access_tokens (Sanctum) ─────────────────────────────────────────
CREATE TABLE personal_access_tokens (
    id             bigserial    PRIMARY KEY,
    tokenable_type varchar(255) NOT NULL,
    tokenable_id   bigint       NOT NULL,
    name           varchar(255) NOT NULL,
    token          varchar(64)  NOT NULL UNIQUE,
    abilities      text,
    last_used_at   timestamp,
    expires_at     timestamp,
    created_at     timestamp,
    updated_at     timestamp
);
CREATE INDEX pat_tokenable_idx ON personal_access_tokens(tokenable_type, tokenable_id);
CREATE INDEX pat_expires_idx   ON personal_access_tokens(expires_at);

-- ── detail_banjir ────────────────────────────────────────────────────────────
CREATE TABLE detail_banjir (
    laporan_id             bigint   PRIMARY KEY REFERENCES laporan_bencana(id) ON DELETE CASCADE,
    kondisi_cuaca_id       smallint REFERENCES opt_kondisi_cuaca(id),
    penyebab_ids           int[]    DEFAULT '{}',
    penyebab_lain          text,
    ketinggian_banjir_id   smallint REFERENCES opt_banjir_ketinggian(id),
    ketinggian_banjir_lain text,
    kondisi_air_id         smallint REFERENCES opt_banjir_kondisi_air(id),
    luas_genangan          text,
    created_at             timestamp NOT NULL DEFAULT now(),
    updated_at             timestamp NOT NULL DEFAULT now()
);

-- ── detail_banjir_bandang ────────────────────────────────────────────────────
CREATE TABLE detail_banjir_bandang (
    laporan_id                   bigint   PRIMARY KEY REFERENCES laporan_bencana(id) ON DELETE CASCADE,
    kondisi_cuaca_id             smallint REFERENCES opt_kondisi_cuaca(id),
    kecepatan_air_id             smallint REFERENCES opt_bandang_kecepatan_air(id),
    kecepatan_air_lain           text,
    kondisi_arus_id              smallint REFERENCES opt_bandang_kondisi_arus(id),
    kondisi_arus_lain            text,
    material_terbawa_ids         int[]    DEFAULT '{}',
    material_terbawa_lain        text,
    kerusakan_infrastruktur_ids  int[]    DEFAULT '{}',
    kerusakan_infrastruktur_lain text,
    created_at                   timestamp NOT NULL DEFAULT now(),
    updated_at                   timestamp NOT NULL DEFAULT now()
);

-- ── detail_tanah_longsor ─────────────────────────────────────────────────────
CREATE TABLE detail_tanah_longsor (
    laporan_id              bigint   PRIMARY KEY REFERENCES laporan_bencana(id) ON DELETE CASCADE,
    kondisi_cuaca_id        smallint REFERENCES opt_kondisi_cuaca(id),
    penyebab_id             smallint REFERENCES opt_longsor_penyebab(id),
    penyebab_lain           text,
    jenis_lokasi_id         smallint REFERENCES opt_longsor_jenis_lokasi(id),
    jenis_lokasi_lain       text,
    dimensi_longsor         text,
    akses_transportasi_id   smallint REFERENCES opt_longsor_akses_transportasi(id),
    akses_transportasi_lain text,
    material_ids            int[]    DEFAULT '{}',
    material_lain           text,
    potensi_susulan_id      smallint REFERENCES opt_longsor_potensi_susulan(id),
    potensi_susulan_lain    text,
    created_at              timestamp NOT NULL DEFAULT now(),
    updated_at              timestamp NOT NULL DEFAULT now()
);

-- ── detail_cuaca_ekstrim ─────────────────────────────────────────────────────
CREATE TABLE detail_cuaca_ekstrim (
    laporan_id              bigint   PRIMARY KEY REFERENCES laporan_bencana(id) ON DELETE CASCADE,
    fenomena_id             smallint REFERENCES opt_cuaca_fenomena(id),
    fenomena_lain           text,
    dampak_pohon_id         smallint REFERENCES opt_cuaca_dampak_pohon(id),
    dampak_pohon_lain       text,
    kerusakan_bangunan_id   smallint REFERENCES opt_cuaca_kerusakan_bangunan(id),
    kerusakan_bangunan_lain text,
    created_at              timestamp NOT NULL DEFAULT now(),
    updated_at              timestamp NOT NULL DEFAULT now()
);

-- ── detail_kekeringan ────────────────────────────────────────────────────────
CREATE TABLE detail_kekeringan (
    laporan_id            bigint       PRIMARY KEY REFERENCES laporan_bencana(id) ON DELETE CASCADE,
    sektor_terdampak_ids  int[]        DEFAULT '{}',
    sektor_terdampak_lain text,
    kondisi_air_id        smallint     REFERENCES opt_kekeringan_kondisi_air(id),
    kondisi_air_lain      text,
    luas_lahan            decimal(12,2),
    jumlah_kk             int          NOT NULL DEFAULT 0,
    durasi_id             smallint     REFERENCES opt_kekeringan_durasi(id),
    durasi_lain           text,
    potensi_risiko_ids    int[]        DEFAULT '{}',
    potensi_risiko_lain   text,
    upaya_masyarakat_ids  int[]        DEFAULT '{}',
    upaya_masyarakat_lain text,
    created_at            timestamp    NOT NULL DEFAULT now(),
    updated_at            timestamp    NOT NULL DEFAULT now()
);

-- ── detail_karhutla ──────────────────────────────────────────────────────────
CREATE TABLE detail_karhutla (
    laporan_id              bigint       PRIMARY KEY REFERENCES laporan_bencana(id) ON DELETE CASCADE,
    kondisi_api_id          smallint     REFERENCES opt_karhutla_kondisi_api(id),
    kondisi_api_lain        text,
    jenis_lahan_id          smallint     REFERENCES opt_karhutla_jenis_lahan(id),
    jenis_lahan_lain        text,
    luas_terbakar           decimal(12,2),
    pemilik_lahan_id        smallint     REFERENCES opt_karhutla_pemilik_lahan(id),
    pemilik_lahan_lain      text,
    jarak_ke_pemukiman_id   smallint     REFERENCES opt_karhutla_jarak_pemukiman(id),
    jarak_ke_pemukiman_lain text,
    sumber_air_id           smallint     REFERENCES opt_karhutla_sumber_air(id),
    sumber_air_lain         text,
    akses_lokasi_id         smallint     REFERENCES opt_karhutla_akses_lokasi(id),
    akses_lokasi_lain       text,
    created_at              timestamp    NOT NULL DEFAULT now(),
    updated_at              timestamp    NOT NULL DEFAULT now()
);

-- ── detail_wabah ─────────────────────────────────────────────────────────────
CREATE TABLE detail_wabah (
    laporan_id               bigint   PRIMARY KEY REFERENCES laporan_bencana(id) ON DELETE CASCADE,
    jenis_penyakit_id        smallint REFERENCES opt_wabah_jenis_penyakit(id),
    jenis_penyakit_lain      text,
    jumlah_bergejala         int      NOT NULL DEFAULT 0,
    sebaran_id               smallint REFERENCES opt_wabah_sebaran(id),
    sebaran_lain             text,
    fasilitas_kesehatan_id   smallint REFERENCES opt_wabah_fasilitas_kesehatan(id),
    fasilitas_kesehatan_lain text,
    kondisi_sanitasi_id      smallint REFERENCES opt_wabah_kondisi_sanitasi(id),
    kondisi_sanitasi_lain    text,
    kronologi                text,
    created_at               timestamp NOT NULL DEFAULT now(),
    updated_at               timestamp NOT NULL DEFAULT now()
);

-- ── detail_gempa_bumi ────────────────────────────────────────────────────────
CREATE TABLE detail_gempa_bumi (
    laporan_id             bigint   PRIMARY KEY REFERENCES laporan_bencana(id) ON DELETE CASCADE,
    durasi_id              smallint REFERENCES opt_gempa_durasi(id),
    durasi_lain            text,
    kekuatan_id            smallint REFERENCES opt_gempa_kekuatan(id),
    kekuatan_lain          text,
    dampak_struktural_ids  int[]    DEFAULT '{}',
    dampak_struktural_lain text,
    kerusakan_jalan_ids    int[]    DEFAULT '{}',
    kerusakan_jalan_lain   text,
    potensi_susulan_id     smallint REFERENCES opt_gempa_potensi_susulan(id),
    potensi_susulan_lain   text,
    kondisi_warga_id       smallint REFERENCES opt_gempa_kondisi_warga(id),
    kondisi_warga_lain     text,
    created_at             timestamp NOT NULL DEFAULT now(),
    updated_at             timestamp NOT NULL DEFAULT now()
);

-- ── detail_konflik_sosial ────────────────────────────────────────────────────
-- CATATAN: aparat_ids adalah array smallint[], BUKAN FK ke opt_konflik_aparat
CREATE TABLE detail_konflik_sosial (
    laporan_id             bigint    PRIMARY KEY REFERENCES laporan_bencana(id) ON DELETE CASCADE,
    sifat_konflik_id       smallint  REFERENCES opt_konflik_sifat(id),
    sifat_konflik_lain     text,
    aktor_id               smallint  REFERENCES opt_konflik_aktor(id),
    aktor_lain             text,
    pemicu_id              smallint  REFERENCES opt_konflik_pemicu(id),
    pemicu_lain            text,
    jumlah_terlibat_id     smallint  REFERENCES opt_konflik_jumlah_terlibat(id),
    jumlah_terlibat_lain   text,
    kerusakan_materil_id   smallint  REFERENCES opt_konflik_kerusakan_materil(id),
    kerusakan_materil_lain text,
    aparat_ids             smallint[],
    created_at             timestamp NOT NULL DEFAULT now(),
    updated_at             timestamp NOT NULL DEFAULT now()
);

-- ── Laravel Framework Tables ─────────────────────────────────────────────────
CREATE TABLE cache (key varchar(255) PRIMARY KEY, value text NOT NULL, expiration int NOT NULL);
CREATE TABLE cache_locks (key varchar(255) PRIMARY KEY, owner varchar(255) NOT NULL, expiration int NOT NULL);

CREATE TABLE jobs (
    id           bigserial    PRIMARY KEY,
    queue        varchar(255) NOT NULL,
    payload      text         NOT NULL,
    attempts     smallint     NOT NULL,
    reserved_at  int,
    available_at int          NOT NULL,
    created_at   int          NOT NULL
);
CREATE INDEX jobs_queue_idx ON jobs(queue);

CREATE TABLE failed_jobs (
    id         bigserial    PRIMARY KEY,
    uuid       varchar(255) NOT NULL UNIQUE,
    connection text         NOT NULL,
    queue      text         NOT NULL,
    payload    text         NOT NULL,
    exception  text         NOT NULL,
    failed_at  timestamp    NOT NULL DEFAULT now()
);

CREATE TABLE job_batches (
    id             varchar(255) PRIMARY KEY,
    name           varchar(255) NOT NULL,
    total_jobs     int          NOT NULL,
    pending_jobs   int          NOT NULL,
    failed_jobs    int          NOT NULL,
    failed_job_ids text         NOT NULL,
    options        text,
    cancelled_at   int,
    created_at     int          NOT NULL,
    finished_at    int
);

CREATE TABLE sessions (
    id            varchar(255) PRIMARY KEY,
    user_id       bigint,
    ip_address    varchar(45),
    user_agent    text,
    payload       text NOT NULL,
    last_activity int  NOT NULL
);
CREATE INDEX sessions_user_id_idx       ON sessions(user_id);
CREATE INDEX sessions_last_activity_idx ON sessions(last_activity);

CREATE TABLE password_reset_tokens (
    email      varchar(255) PRIMARY KEY,
    token      varchar(255) NOT NULL,
    created_at timestamp
);

-- ── migrations (Laravel tracking) ────────────────────────────────────────────
CREATE TABLE migrations (
    id        serial       PRIMARY KEY,
    migration varchar(255) NOT NULL,
    batch     int          NOT NULL
);
